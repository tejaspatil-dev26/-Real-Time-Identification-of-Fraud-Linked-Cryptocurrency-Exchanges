import logging
import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
from celery import Celery
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Celery app instance for CryptoTrace
celery_app = Celery(
    "cryptotrace_mempool_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

@celery_app.task(name="app.workers.mempool_tasks.process_mempool_match", bind=True, max_retries=3)
def process_mempool_match(
    self,
    tx_hash: str,
    matched_address: str,
    network: str = "ETHEREUM",
    tx_data: Optional[Dict[str, Any]] = None,
    case_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background Celery worker task that:
    1. Silently logs the intercepted mempool match into the database AuditLog.
    2. Calculates predictive off-ramps to terminal VASPs using IntelligenceService without frontend latency.
    """
    logger.info(f"[MEMPOOL_WORKER] Processing intercepted mempool match for address: {matched_address} (TX: {tx_hash})")
    
    # Calculate predictive off-ramps silently
    from app.services.intelligence_service import IntelligenceService
    offramp_predictions = IntelligenceService.predict_offramp_probabilities(case_id=case_id or "mempool_live")

    # Async database logging helper
    async def _log_to_db():
        from app.core.database import AsyncSessionLocal
        from app.models.evidence import AuditLog
        async with AsyncSessionLocal() as session:
            try:
                log_entry = AuditLog(
                    case_id=case_id,
                    action="MEMPOOL_INTERCEPT_MATCH",
                    payload_snapshot={
                        "tx_hash": tx_hash,
                        "matched_address": matched_address,
                        "network": network,
                        "tx_data": tx_data or {},
                        "predictive_offramps": offramp_predictions,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    ip_address="127.0.0.1"
                )
                session.add(log_entry)
                await session.commit()
                logger.info(f"[MEMPOOL_WORKER] Recorded match in AuditLog for {matched_address}")
            except Exception as e:
                logger.error(f"[MEMPOOL_WORKER] Failed to record audit log: {e}")
                await session.rollback()

    try:
        loop = None
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        if loop and loop.is_running():
            asyncio.create_task(_log_to_db())
        else:
            asyncio.run(_log_to_db())
    except Exception as ex:
        logger.error(f"[MEMPOOL_WORKER] Error scheduling DB log: {ex}")

    return {
        "status": "PROCESSED",
        "tx_hash": tx_hash,
        "matched_address": matched_address,
        "network": network,
        "predictive_offramps": offramp_predictions
    }


def dispatch_mempool_match(
    tx_hash: str,
    matched_address: str,
    network: str = "ETHEREUM",
    tx_data: Optional[Dict[str, Any]] = None,
    case_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Safely dispatches the mempool match to Celery worker;
    if Celery / Redis broker is unavailable, runs task safely via direct invocation.
    """
    try:
        async_res = process_mempool_match.delay(
            tx_hash=tx_hash,
            matched_address=matched_address,
            network=network,
            tx_data=tx_data,
            case_id=case_id
        )
        return {"status": "DISPATCHED_ASYNC", "task_id": async_res.id}
    except Exception as ex:
        logger.info(f"[MEMPOOL_DISPATCHER] Celery broker unavailable ({ex}), executing task inline.")
        return process_mempool_match(
            None,
            tx_hash=tx_hash,
            matched_address=matched_address,
            network=network,
            tx_data=tx_data,
            case_id=case_id
        )
