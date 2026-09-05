import os
import hashlib
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.case import Case
from app.models.cluster import EntityCluster, ClusterCategory, CrossChainBridgeEvent
from app.models.evidence import AuditLog
from app.ml.gnn_inference import GNNInferenceEngine
from app.services.rpc_service import MempoolRPCMonitor
from app.services.evidence_service import EvidenceService

# =========================================================================
# Phase 1: Mempool RPC Monitor Address Matching & Dispatch
# =========================================================================

@pytest.mark.asyncio
async def test_mempool_monitor_watchlist_matching(monkeypatch):
    monitor = MempoolRPCMonitor(wss_url="ws://127.0.0.1:8545", poll_interval=1.0)
    target_wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    await monitor.add_to_watchlist(target_wallet)

    assert target_wallet.lower() in monitor._local_watchlist

    # Track dispatched calls
    dispatched_events = []
    def mock_dispatch(tx_hash, matched_address, network, tx_data):
        dispatched_events.append({
            "tx_hash": tx_hash,
            "matched_address": matched_address,
            "network": network,
            "tx_data": tx_data
        })

    from app.services import rpc_service
    monkeypatch.setattr(rpc_service, "dispatch_mempool_match", mock_dispatch)

    # Test matching tx
    tx_matching = {
        "hash": "0xabc1234567890",
        "from": target_wallet,
        "to": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
        "value": "0xDE0B6B3A7640000"  # 1 ETH
    }
    matched = await monitor.filter_and_dispatch(tx_matching)
    assert matched is True
    assert len(dispatched_events) == 1
    assert dispatched_events[0]["matched_address"] == target_wallet.lower()
    assert dispatched_events[0]["tx_hash"] == "0xabc1234567890"

    # Non-matching tx
    tx_non_matching = {
        "hash": "0xdef9999999999",
        "from": "0x1111111111111111111111111111111111111111",
        "to": "0x2222222222222222222222222222222222222222",
        "value": "0x0"
    }
    matched_non = await monitor.filter_and_dispatch(tx_non_matching)
    assert matched_non is False
    assert len(dispatched_events) == 1  # No additional dispatch


# =========================================================================
# Phase 2: PyTorch Geometric GNN Inference & Smurfing Calibration
# =========================================================================

def test_gnn_inference_engine_feature_and_scores():
    nodes = [
        {"data": {"id": "w_seed", "balance": 10.0, "is_seed": True, "risk_score": 0.95, "hop_depth": 0}},
        {"data": {"id": "w_mixer", "balance": 5.0, "mixer_interaction": True, "risk_score": 0.88, "hop_depth": 1}},
        {"data": {"id": "w_peel", "balance": 2.0, "peel_chain_detected": True, "risk_score": 0.75, "hop_depth": 2}},
        {"data": {"id": "w_benign", "balance": 0.05, "is_seed": False, "risk_score": 0.1, "hop_depth": 1}},
    ]
    edges = [
        {"data": {"source": "w_seed", "target": "w_mixer", "amount_usd": 15000.0, "gas_fee": 12.5}},
        {"data": {"source": "w_mixer", "target": "w_peel", "amount_usd": 6000.0, "gas_fee": 8.0}},
        {"data": {"source": "w_seed", "target": "w_benign", "amount_usd": 150.0, "gas_fee": 2.0}},
    ]

    # 1. Feature extraction and PyG Data construction
    data_obj, addresses, x_tensor, edge_index = GNNInferenceEngine.build_pyg_data(nodes, edges)
    assert len(addresses) == 4
    assert x_tensor.shape == (4, 64)
    assert edge_index.shape[0] == 2

    # 2. Inductive GraphSAGE smurfing scores
    scores = GNNInferenceEngine.predict_smurfing_scores(nodes, edges)
    assert len(scores) == 4
    assert "w_seed" in scores
    assert "w_mixer" in scores
    assert "w_peel" in scores
    assert "w_benign" in scores

    # Assert calibrated probabilities: illicit entities are high, benign is low
    assert scores["w_seed"] >= 0.85
    assert scores["w_mixer"] >= 0.80
    assert scores["w_peel"] >= 0.75
    assert scores["w_benign"] <= 0.35


# =========================================================================
# Phase 3: Additive Database Models (EntityCluster, CrossChainBridgeEvent)
# =========================================================================

@pytest.mark.asyncio
async def test_additive_database_models():
    async with AsyncSessionLocal() as session:
        # Create Case
        new_case = Case(
            case_number="CASE-EXPANSION-001",
            title="Expansion Phase Test Case",
            description="Testing EntityCluster and CrossChainBridgeEvent models",
            primary_investigator_id="usr-inv-01"
        )
        session.add(new_case)
        await session.commit()
        await session.refresh(new_case)

        # Create EntityCluster
        cluster = EntityCluster(
            primary_category=ClusterCategory.MIXER,
            risk_score=94.5,
            wallet_addresses=["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"],
            case_id=new_case.id
        )
        session.add(cluster)

        # Create CrossChainBridgeEvent
        bridge_evt = CrossChainBridgeEvent(
            source_chain="ETHEREUM",
            dest_chain="POLYGON",
            usd_value=18500.0,
            source_tx_hash="0xabc000111222",
            dest_tx_hash="0xdef333444555",
            source_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            dest_wallet="0x8888888888888888888888888888888888888888",
            bridge_protocol="HopProtocol"
        )
        session.add(bridge_evt)
        await session.commit()

        # Query back and verify relationships
        stmt = select(EntityCluster).where(EntityCluster.case_id == new_case.id)
        fetched_cluster = (await session.execute(stmt)).scalar_one()
        assert fetched_cluster.primary_category == ClusterCategory.MIXER
        assert fetched_cluster.risk_score == 94.5
        assert len(fetched_cluster.wallet_addresses) == 2

        stmt_bridge = select(CrossChainBridgeEvent).where(CrossChainBridgeEvent.source_tx_hash == "0xabc000111222")
        fetched_bridge = (await session.execute(stmt_bridge)).scalar_one()
        assert fetched_bridge.source_chain == "ETHEREUM"
        assert fetched_bridge.dest_chain == "POLYGON"
        assert fetched_bridge.bridge_protocol == "HopProtocol"
        assert fetched_bridge.usd_value == 18500.0


# =========================================================================
# Phase 4: Isolated Advanced Evidence API (18 U.S.C. § 981 Subpoena)
# =========================================================================

def test_evidence_service_freeze_subpoena_generation():
    dossier = EvidenceService.generate_freeze_subpoena_dossier(
        case_id="case-freeze-999",
        case_number="CASE-FREEZE-999",
        vasp_name="Binance",
        legal_entity_name="Binance Holdings Limited (Cayman)",
        compliance_email="lawenforcement@binance.com",
        deposit_address="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
        absorbed_usd=54200.0,
        investigator_email="agent.smith@fbi.gov",
        statutory_authority="18 U.S.C. § 981"
    )

    assert "subpoena_id" in dossier
    assert "file_hash" in dossier
    assert len(dossier["file_hash"]) == 64
    assert os.path.exists(dossier["path"])

    # Verify SHA-256 integrity of generated PDF
    with open(dossier["path"], "rb") as f:
        content = f.read()
    assert hashlib.sha256(content).hexdigest() == dossier["file_hash"]


@pytest.mark.asyncio
async def test_freeze_subpoena_api_and_download(client: AsyncClient):
    # 1. Login
    login = await client.post("/api/v1/auth/login", json={
        "email": "agent.smith@fbi.gov",
        "password": "InvestigatorPassword123!"
    })
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Case
    case_res = await client.post("/api/v1/cases", headers=headers, json={
        "title": "Subpoena Asset Seizure Test Case",
        "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    })
    assert case_res.status_code == 201
    case_id = case_res.json()["id"]

    # 3. Call POST /api/v1/evidence/{case_id}/freeze-subpoena
    subpoena_res = await client.post(f"/api/v1/evidence/{case_id}/freeze-subpoena", headers=headers, json={
        "vasp_name": "Coinbase",
        "deposit_address": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
        "absorbed_usd": 38750.0
    })
    assert subpoena_res.status_code == 201
    data = subpoena_res.json()
    assert data["status"] == "success"
    assert "subpoena_id" in data
    assert data["statutory_authority"] == "18 U.S.C. § 981"
    assert len(data["file_hash"]) == 64
    assert "download_url" in data

    subpoena_id = data["subpoena_id"]

    # 4. Verify AuditLog was created in DB
    async with AsyncSessionLocal() as session:
        audit_stmt = select(AuditLog).where(
            AuditLog.case_id == case_id,
            AuditLog.action == "FREEZE_SUBPOENA_GENERATED"
        )
        audit_entry = (await session.execute(audit_stmt)).scalar_one_or_none()
        assert audit_entry is not None
        assert audit_entry.payload_snapshot["subpoena_id"] == subpoena_id

    # 5. Call GET /api/v1/evidence/{case_id}/freeze-subpoena/download
    download_res = await client.get(
        f"/api/v1/evidence/{case_id}/freeze-subpoena/download?subpoena_id={subpoena_id}",
        headers=headers
    )
    assert download_res.status_code == 200
    assert download_res.headers["content-type"] == "application/pdf"
    assert len(download_res.content) > 0
