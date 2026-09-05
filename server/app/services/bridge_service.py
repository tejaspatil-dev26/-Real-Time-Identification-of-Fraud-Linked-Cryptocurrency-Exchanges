from typing import Any, Dict, List, Optional
import uuid

class BridgeService:
    """
    Multi-Chain Cross-Bridge Tracking Service.
    Maps cross-chain bridge smart contracts and identifies chain-hopping
    transactions across Ethereum, Bitcoin, Polygon, Arbitrum, Avalanche, and Solana.
    """

    KNOWN_BRIDGES: List[Dict[str, Any]] = [
        {
            "bridge_name": "ThorChain Native Router",
            "protocol": "ThorChain",
            "origin_chain": "ETHEREUM",
            "destination_chain": "BITCOIN",
            "contract_address": "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
            "risk_tier": "HIGH",
            "typical_hop_delay_sec": 300,
        },
        {
            "bridge_name": "Wormhole Core Bridge",
            "protocol": "Wormhole",
            "origin_chain": "ETHEREUM",
            "destination_chain": "SOLANA",
            "contract_address": "0x98f3c9e6E3fAce36bA8Cee86ac777672234c9028",
            "risk_tier": "MEDIUM",
            "typical_hop_delay_sec": 120,
        },
        {
            "bridge_name": "Hop Protocol: ETH Bridge",
            "protocol": "Hop Protocol",
            "origin_chain": "ETHEREUM",
            "destination_chain": "POLYGON",
            "contract_address": "0xb8901acB165ed027E32754E0FFe830802919727f",
            "risk_tier": "MEDIUM",
            "typical_hop_delay_sec": 180,
        },
        {
            "bridge_name": "Stargate Finance Router",
            "protocol": "LayerZero / Stargate",
            "origin_chain": "ETHEREUM",
            "destination_chain": "AVALANCHE",
            "contract_address": "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
            "risk_tier": "LOW",
            "typical_hop_delay_sec": 90,
        },
    ]

    @classmethod
    def identify_bridge_contract(cls, address: str) -> Optional[Dict[str, Any]]:
        clean_addr = address.lower()
        for bridge in cls.KNOWN_BRIDGES:
            if bridge["contract_address"].lower() == clean_addr:
                return bridge
        return None

    @classmethod
    def simulate_cross_chain_hop(
        cls,
        source_address: str,
        amount_usd: float,
        origin_chain: str = "ETHEREUM",
        target_chain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a cross-chain hop link between origin and destination chains
        when a suspect wallet interacts with a bridge deposit contract.
        """
        bridge = cls.KNOWN_BRIDGES[0]
        if target_chain:
            for b in cls.KNOWN_BRIDGES:
                if b["destination_chain"] == target_chain:
                    bridge = b
                    break

        bridge_node_id = f"bridge-{bridge['protocol'].lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}"
        destination_wallet = f"0x{uuid.uuid4().hex[:40]}" if bridge["destination_chain"] != "BITCOIN" else f"bc1q{uuid.uuid4().hex[:36]}"

        return {
            "bridge_node": {
                "data": {
                    "id": bridge_node_id,
                    "label": f"BRIDGE: {bridge['bridge_name']}",
                    "type": "bridge",
                    "protocol": bridge["protocol"],
                    "origin_chain": bridge["origin_chain"],
                    "destination_chain": bridge["destination_chain"],
                    "contract_address": bridge["contract_address"],
                    "risk_score": 0.85,
                    "is_contract": True,
                }
            },
            "destination_node": {
                "data": {
                    "id": destination_wallet,
                    "label": f"RECEIVE ({destination_wallet[:6]}...{destination_wallet[-4:]})",
                    "type": "wallet",
                    "network": bridge["destination_chain"],
                    "balance": round(amount_usd * 0.995 / 3000, 4),
                    "risk_score": 0.88,
                    "is_seed": False,
                    "hop_depth": 3,
                }
            },
            "bridge_in_edge": {
                "data": {
                    "id": f"e-in-{uuid.uuid4().hex[:6]}",
                    "source": source_address,
                    "target": bridge_node_id,
                    "amount": round(amount_usd / 3000, 4),
                    "amount_usd": amount_usd,
                    "token": "ETH",
                    "is_bridge_hop": True,
                }
            },
            "bridge_out_edge": {
                "data": {
                    "id": f"e-out-{uuid.uuid4().hex[:6]}",
                    "source": bridge_node_id,
                    "target": destination_wallet,
                    "amount": round(amount_usd * 0.995 / 3000, 4),
                    "amount_usd": round(amount_usd * 0.995, 2),
                    "token": "WBTC" if bridge["destination_chain"] == "BITCOIN" else "USDC",
                    "is_bridge_hop": True,
                }
            },
            "hop_metadata": {
                "protocol": bridge["protocol"],
                "origin_chain": bridge["origin_chain"],
                "destination_chain": bridge["destination_chain"],
                "estimated_bridge_fee_usd": round(amount_usd * 0.005, 2),
            }
        }
