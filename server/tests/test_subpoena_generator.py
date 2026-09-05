import os
import pytest
from httpx import AsyncClient
from app.services.evidence_service import EvidenceService

def test_vasp_subpoena_pdf_and_text_generation():
    subpoena = EvidenceService.generate_vasp_subpoena(
        case_id="case-subpoena-123",
        case_number="CASE-SUBP-123",
        vasp_name="Binance",
        deposit_address="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
        absorbed_usd=25400.0,
        investigator_email="agent.smith@fbi.gov"
    )

    assert "pdf_path" in subpoena
    assert os.path.exists(subpoena["pdf_path"])
    assert "subpoena_text" in subpoena
    assert "18 U.S.C. § 981" in subpoena["subpoena_text"]
    assert "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be" in subpoena["subpoena_text"]
    assert "25,400.00" in subpoena["subpoena_text"]

def test_fincen_sar_narrative_generation():
    sar = EvidenceService.generate_fincen_sar_narrative(
        case_number="CASE-SAR-456",
        seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        network="ETHEREUM",
        anomalies={"peel_chains_count": 2, "smurfing_fan_out_count": 3, "suspect_total_illicit_volume_usd": 50000.0},
        vasp_hits=[{"vasp_name": "Binance", "absorbed_volume_usd": 30000.0, "deposit_address": "0x3f5ce5"}],
        investigator_email="agent.smith@fbi.gov"
    )

    assert "sar_narrative" in sar
    assert "FINANCIAL CRIMES ENFORCEMENT NETWORK (FinCEN)" in sar["sar_narrative"]
    assert "CASE-SAR-456" in sar["sar_narrative"]
    assert "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" in sar["sar_narrative"]
    assert "50,000.00" in sar["sar_narrative"]
