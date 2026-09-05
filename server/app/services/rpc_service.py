import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Set
import websockets
from app.core.config import settings
from app.workers.mempool_tasks import dispatch_mempool_match

logger = logging.getLogger(__name__)

class MempoolRPCMonitor:
    """
    Asynchronous background worker system to monitor live blockchain mempools
    via WebSocket RPC nodes without blocking FastAPI event loop or adding frontend latency.
    """
    _instance: Optional["MempoolRPCMonitor"] = None

    def __init__(self, wss_url: Optional[str] = None, poll_interval: Optional[float] = None):
        self._running: bool = False
        self._monitor_task: Optional[asyncio.Task] = None
        self._local_watchlist: Set[str] = set()
        self._redis_client = None
        self._redis_disabled: bool = False
        self._poll_interval = poll_interval or 1.0
        self._wss_url: str = wss_url or self._resolve_wss_url()

    @classmethod
    def get_instance(cls) -> "MempoolRPCMonitor":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _resolve_wss_url(self) -> str:
        # Resolve WebSocket URL from ETH_RPC_URL or public failover
        url = settings.ETH_RPC_URL
        if url.startswith("http://"):
            return url.replace("http://", "ws://")
        elif url.startswith("https://"):
            return url.replace("https://", "wss://")
        elif url.startswith("ws://") or url.startswith("wss://"):
            return url
        return "wss://ethereum-rpc.publicnode.com"

    async def _get_redis(self):
        if self._redis_disabled:
            return None
        if self._redis_client is None:
            try:
                import redis.asyncio as aioredis
                self._redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1
                )
                await self._redis_client.ping()
                logger.info("[MEMPOOL_MONITOR] Connected to Redis watchlist cache.")
            except Exception as e:
                logger.warning(f"[MEMPOOL_MONITOR] Redis unavailable ({e}). Using in-memory watchlist.")
                self._redis_client = None
                self._redis_disabled = True
        return self._redis_client

    async def add_to_watchlist(self, address: str) -> None:
        """Adds a wallet address to both local memory and Redis cache."""
        clean_addr = address.strip().lower()
        self._local_watchlist.add(clean_addr)
        redis_conn = await self._get_redis()
        if redis_conn:
            try:
                await redis_conn.sadd("watchlist:wallets", clean_addr)
            except Exception as ex:
                logger.warning(f"[MEMPOOL_MONITOR] Failed to update Redis watchlist: {ex}")

    async def remove_from_watchlist(self, address: str) -> None:
        clean_addr = address.strip().lower()
        self._local_watchlist.discard(clean_addr)
        redis_conn = await self._get_redis()
        if redis_conn:
            try:
                await redis_conn.srem("watchlist:wallets", clean_addr)
            except Exception:
                pass

    async def get_watchlist(self) -> Set[str]:
        """Returns the full watchlist of monitored seed and suspect wallets."""
        redis_conn = await self._get_redis()
        if redis_conn:
            try:
                cached_addrs = await redis_conn.smembers("watchlist:wallets")
                if cached_addrs:
                    self._local_watchlist.update(addr.lower() for addr in cached_addrs)
            except Exception:
                pass
        return self._local_watchlist

    async def is_address_watched(self, address: str) -> bool:
        clean_addr = address.strip().lower()
        if clean_addr in self._local_watchlist:
            return True
        redis_conn = await self._get_redis()
        if redis_conn:
            try:
                return await redis_conn.sismember("watchlist:wallets", clean_addr)
            except Exception:
                pass
        return False

    async def sync_watchlist_from_db(self) -> int:
        """
        Synchronizes suspect wallet addresses from the database into the Redis watchlist.
        """
        try:
            from app.core.database import AsyncSessionLocal
            from app.models.case import SuspectWallet
            from sqlalchemy import select

            async with AsyncSessionLocal() as session:
                stmt = select(SuspectWallet.address)
                result = await session.execute(stmt)
                addresses = result.scalars().all()

                count = 0
                for addr in addresses:
                    await self.add_to_watchlist(addr)
                    count += 1

                # Include known default syndicate seed if empty
                if not addresses:
                    default_seed = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                    await self.add_to_watchlist(default_seed)
                    count += 1

                logger.info(f"[MEMPOOL_MONITOR] Synchronized {count} suspect wallets into mempool watchlist.")
                return count
        except Exception as e:
            logger.error(f"[MEMPOOL_MONITOR] Failed to sync watchlist from database: {e}")
            # Fallback to default suspect seed
            default_seed = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
            await self.add_to_watchlist(default_seed)
            return len(self._local_watchlist)

    async def filter_and_dispatch(self, tx_data: Dict[str, Any]) -> bool:
        """
        Checks if transaction involves any address on the watchlist.
        If matched, dispatches a Celery background task silently.
        """
        tx_from = str(tx_data.get("from", "")).lower()
        tx_to = str(tx_data.get("to", "")).lower()
        tx_hash = str(tx_data.get("hash", tx_data.get("tx_hash", "")))

        watchlist = await self.get_watchlist()
        matched_addr = None

        if tx_from in watchlist:
            matched_addr = tx_from
        elif tx_to in watchlist:
            matched_addr = tx_to

        if matched_addr and tx_hash:
            logger.warning(f"[MEMPOOL_MONITOR] ALERT: Watched address {matched_addr} matched in live mempool TX {tx_hash}!")
            dispatch_mempool_match(
                tx_hash=tx_hash,
                matched_address=matched_addr,
                network="ETHEREUM",
                tx_data=tx_data
            )
            return True
        return False

    async def _monitor_loop(self) -> None:
        """
        Persistent background WebSocket connection listening to newPendingTransactions.
        Includes automatic exponential backoff reconnection.
        """
        backoff = 2
        while self._running:
            try:
                logger.info(f"[MEMPOOL_MONITOR] Connecting to WSS node at {self._wss_url}...")
                async with websockets.connect(
                    self._wss_url,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=5
                ) as ws:
                    logger.info("[MEMPOOL_MONITOR] WSS connection established. Subscribing to newPendingTransactions...")
                    # Subscribe to newPendingTransactions
                    sub_req = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_subscribe",
                        "params": ["newPendingTransactions"]
                    }
                    await ws.send(json.dumps(sub_req))
                    sub_resp = await ws.recv()
                    logger.info(f"[MEMPOOL_MONITOR] Subscribed to mempool: {sub_resp}")
                    backoff = 2  # reset backoff upon success

                    while self._running:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
                            data = json.loads(msg)
                            
                            # Filter standard notification
                            if "params" in data and "result" in data["params"]:
                                tx_info = data["params"]["result"]
                                if isinstance(tx_info, str):
                                    # Hex transaction hash
                                    tx_hash = tx_info
                                    # In high-throughput Erigon/Geth nodes, check against watchlist
                                    # (If full tx is emitted or address hex stream)
                                    pass
                                elif isinstance(tx_info, dict):
                                    await self.filter_and_dispatch(tx_info)
                        except asyncio.TimeoutError:
                            # Send heartbeat ping
                            pong = await ws.ping()
                            await asyncio.wait_for(pong, timeout=10.0)
                        except websockets.ConnectionClosed:
                            logger.warning("[MEMPOOL_MONITOR] WebSocket connection closed by remote peer.")
                            break
            except asyncio.CancelledError:
                logger.info("[MEMPOOL_MONITOR] Monitor task cancelled.")
                break
            except Exception as e:
                logger.warning(f"[MEMPOOL_MONITOR] WebSocket stream error: {e}. Reconnecting in {backoff}s...")
                await asyncio.sleep(backoff)
                backoff = min(60, backoff * 2)

    def start_monitor(self) -> None:
        """Starts the background worker system without blocking the FastAPI event loop."""
        if self._running:
            return
        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        logger.info("[MEMPOOL_MONITOR] Background mempool monitor task started.")

    async def stop_monitor(self) -> None:
        """Gracefully stops the background mempool monitor."""
        self._running = False
        if self._monitor_task and not self._monitor_task.done():
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass
        logger.info("[MEMPOOL_MONITOR] Background mempool monitor stopped.")
