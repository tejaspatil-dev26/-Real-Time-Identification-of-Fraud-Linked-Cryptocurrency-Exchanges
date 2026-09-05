import os
import hashlib
import json
import pytest
from httpx import AsyncClient
from app.services.evidence_service import EvidenceService

def test_iso27037_evidence_generation_and_hashing():
    case_id = "test-case-789"
    case_number = "CASE-TEST-789"
    investigator_id = "agent-smith-01"
    investigator_email = "agent.smith@fbi.gov"

    graph_data = {
        "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "network": "ETHEREUM",
        "max_depth": 5,
        "nodes": [{"data": {"id": "w1"}}, {"data": {"id": "w2"}}],
        "edges": [{"data": {"source": "w1", "target": "w2", "amount": 5.0}}],
        "anomalies": {
            "peel_chains_count": 1,
            "smurfing_fan_out_count": 2,
            "suspect_total_illicit_volume_usd": 15000.0,
            "identified_terminal_vasps": [{"vasp_name": "Binance", "absorbed_volume_usd": 15000.0}]
        }
    }

    pkg = EvidenceService.generate_iso27037_package(
        case_id=case_id,
        case_number=case_number,
        investigator_id=investigator_id,
        investigator_email=investigator_email,
        graph_data=graph_data
    )

    # Verify SHA-256 hash exists and is 64 hex characters
    sha256 = pkg["sha256_hash"]
    assert len(sha256) == 64
    assert all(c in "0123456789abcdef" for c in sha256.lower())

    # Verify local evidence file was written and hash matches file contents
    assert os.path.exists(pkg["local_path"])
    with open(pkg["local_path"], "r", encoding="utf-8") as f:
        file_content = f.read()
    computed_hash = hashlib.sha256(file_content.encode("utf-8")).hexdigest()
    assert computed_hash == sha256

    # Verify PDF report was generated
    assert os.path.exists(pkg["pdf_path"])

@pytest.mark.asyncio
async def test_evidence_api_endpoint(client: AsyncClient):
    # Login
    login = await client.post("/api/v1/auth/login", json={
        "email": "agent.smith@fbi.gov",
        "password": "InvestigatorPassword123!"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Case
    case_res = await client.post("/api/v1/cases", headers=headers, json={
        "title": "Evidence Verification Case",
        "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    })
    case_id = case_res.json()["id"]

    # Generate Evidence
    ev_res = await client.post(f"/api/v1/evidence/{case_id}/generate", headers=headers, json={
        "case_id": case_id,
        "include_graph_topology": True,
        "include_gnn_explainability": True
    })

    assert ev_res.status_code == 201
    ev_data = ev_res.json()
    assert "sha256_hash" in ev_data
    assert ev_data["standard_compliance"] == "ISO/IEC 27037:2012"
