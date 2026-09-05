import pytest
from app.services.neo4j_service import Neo4jService
from app.services.rpc_client import RPCClient

@pytest.mark.asyncio
async def test_multi_hop_graph_traversal_and_anomaly_detection():
    seed = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    res = await Neo4jService.ingest_investigation_graph(
        task_id="test-task-123",
        case_id="test-case-456",
        seed_wallet=seed,
        network="ETHEREUM",
        max_depth=5,
        min_usd_threshold=500.0
    )

    assert res["seed_wallet"] == seed
    assert len(res["nodes"]) >= 5
    assert len(res["edges"]) >= 4

    anomalies = res["anomalies"]
    assert "peel_chains_count" in anomalies
    assert "smurfing_fan_out_count" in anomalies
    assert "identified_terminal_vasps" in anomalies
    assert len(anomalies["identified_terminal_vasps"]) >= 1

    # Check terminal VASP identification
    vasp_names = [v["vasp_name"] for v in anomalies["identified_terminal_vasps"]]
    assert any(name in ["Binance", "Coinbase", "Kraken", "OKX"] for name in vasp_names)
