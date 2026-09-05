import os
import pytest
from app.services.evidence_service import EvidenceService
from app.services.rpc_client import RPCClient

def test_fraud_dossier_summary_generation():
    raw_graph = RPCClient._generate_forensic_topology(
        seed_address="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        network="ETHEREUM",
        max_depth=4,
        min_usd_threshold=500.0
    )

    dossier = EvidenceService.get_fraud_dossier_summary(
        case_id="case-dossier-test-1",
        case_number="CASE-DOSSIER-101",
        graph_data=raw_graph,
        investigator_email="agent.smith@fbi.gov"
    )

    assert "suspect_profile" in dossier
    assert "alias" in dossier["suspect_profile"]
    assert "seed_wallet" in dossier["suspect_profile"]
    assert dossier["suspect_profile"]["seed_wallet"] == "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    assert "ip_cluster" in dossier["suspect_profile"]
    assert "origin_city" in dossier["suspect_profile"]
    assert "origin_country" in dossier["suspect_profile"]
    assert "terminal_vasps" in dossier
    assert len(dossier["terminal_vasps"]) >= 1

def test_fraud_dossier_pdf_creation_and_sha256():
    raw_graph = RPCClient._generate_forensic_topology(
        seed_address="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        network="ETHEREUM",
        max_depth=4,
        min_usd_threshold=500.0
    )

    result = EvidenceService.generate_fraud_dossier_pdf(
        case_id="case-dossier-test-2",
        case_number="CASE-DOSSIER-202",
        graph_data=raw_graph,
        investigator_email="agent.smith@fbi.gov"
    )

    assert "pdf_path" in result
    pdf_path = result["pdf_path"]
    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000 # Valid non-empty PDF

    with open(pdf_path, "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-" # Valid PDF signature

    assert "sha256_hash" in result
    assert len(result["sha256_hash"]) == 64
