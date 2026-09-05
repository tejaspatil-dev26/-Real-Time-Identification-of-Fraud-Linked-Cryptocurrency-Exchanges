import pytest
from app.services.bridge_service import BridgeService

def test_bridge_contract_identification():
    # ThorChain
    thorchain_addr = "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146"
    bridge = BridgeService.identify_bridge_contract(thorchain_addr)
    assert bridge is not None
    assert bridge["protocol"] == "ThorChain"
    assert bridge["destination_chain"] == "BITCOIN"

    # Non-bridge address
    unknown = BridgeService.identify_bridge_contract("0x0000000000000000000000000000000000000000")
    assert unknown is None

def test_cross_chain_hop_simulation():
    source_wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    hop = BridgeService.simulate_cross_chain_hop(
        source_address=source_wallet,
        amount_usd=15000.0,
        origin_chain="ETHEREUM",
        target_chain="BITCOIN"
    )

    assert "bridge_node" in hop
    assert "destination_node" in hop
    assert "bridge_in_edge" in hop
    assert "bridge_out_edge" in hop

    # Verify bridge node properties
    b_data = hop["bridge_node"]["data"]
    assert b_data["type"] == "bridge"
    assert b_data["protocol"] == "ThorChain"
    assert b_data["destination_chain"] == "BITCOIN"

    # Verify edge connectivity
    in_edge = hop["bridge_in_edge"]["data"]
    out_edge = hop["bridge_out_edge"]["data"]
    assert in_edge["source"] == source_wallet
    assert in_edge["target"] == b_data["id"]
    assert out_edge["source"] == b_data["id"]
    assert out_edge["target"] == hop["destination_node"]["data"]["id"]
