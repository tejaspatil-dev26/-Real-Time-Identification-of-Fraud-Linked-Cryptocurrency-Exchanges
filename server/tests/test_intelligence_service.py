import pytest
from app.services.intelligence_service import IntelligenceService
from app.services.alert_service import AlertService

def test_ofac_sanctions_screening():
    sanctioned = "0x8576acc5c05d6ce07148ca99def8650b4957554f"
    clean = "0x0000000000000000000000000000000000000000"
    results = IntelligenceService.screen_wallets_ofac([sanctioned, clean])
    assert len(results) == 2
    assert results[0]["matched"] is True
    assert "Lazarus" in results[0]["entity_name"]
    assert results[1]["matched"] is False

def test_predictive_offramp():
    case_id = "test-case-123"
    result = IntelligenceService.predict_offramp_probabilities(case_id)
    assert result["case_id"] == case_id
    assert "top_predicted_vasp" in result
    assert result["top_probability_pct"] > 0
    assert len(result["probabilities"]) >= 3

def test_ai_copilot_queries():
    case_id = "test-case-copilot"
    mock_graph = {
        "nodes": [
            {"id": "0x123", "label": "Binance Deposit", "type": "VASP", "entity": "Binance"},
            {"id": "0x456", "label": "Mule 1", "type": "MULE", "risk_score": 85}
        ],
        "edges": [
            {"id": "e1", "source": "0x456", "target": "0x123", "amount_usd": 15000}
        ],
        "suspect_profile": {
            "alias": "ShadowVault Syndicate (APT-44)",
            "threat_score": 92.5
        }
    }

    # Test Binance query
    res_binance = IntelligenceService.query_ai_copilot(case_id, "Show me Binance wallets", mock_graph)
    assert res_binance["intent"] == "FILTER_VASP_BINANCE"
    assert "0x123" in res_binance["highlighted_node_ids"]

    # Test Threat Score query
    res_threat = IntelligenceService.query_ai_copilot(case_id, "What is the threat score?", mock_graph)
    assert res_threat["intent"] == "SUSPECT_PROFILING"
    assert "ShadowVault" in res_threat["response"]

def test_multi_chain_generation():
    tron_graph = IntelligenceService.generate_multi_chain_graph("TRON", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "case-tron")
    assert tron_graph["chain"] == "TRON"
    assert len(tron_graph["nodes"]) >= 4
    assert tron_graph["token"] == "USDT (TRC-20)"

    btc_graph = IntelligenceService.generate_multi_chain_graph("BITCOIN", "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "case-btc")
    assert btc_graph["chain"] == "BITCOIN"
    assert btc_graph["model"] == "UTXO"
    assert len(btc_graph["nodes"]) >= 3

def test_digital_freeze_mandate():
    mandate = IntelligenceService.generate_digital_freeze_mandate(
        case_id="case-freeze-1",
        case_number="CASE-2026-991",
        vasp_name="Binance",
        deposit_address="0x28C6c06298d514Db089934071355E5743bf21d60",
        absorbed_usd=57711.36,
        investigator_email="agent.smith@fbi.gov"
    )
    assert mandate["status"] == "IMMEDIATE_PRESERVATION_ORDERED"
    assert len(mandate["sha256_cryptographic_seal"]) == 64
    assert mandate["target_vasp"]["name"] == "Binance"

def test_alert_service_evaluation():
    mock_graph = {
        "nodes": [
            {"id": "0xmix", "type": "MIXER", "label": "Tornado Cash Pool", "balance_usd": 150000}
        ],
        "edges": [
            {"source": "0xa", "target": "0xb", "amount_usd": 75000}
        ],
        "suspect_profile": {
            "seed_wallet": "0xseed",
            "ip_cluster": "103.208.220.15",
            "origin_city": "Phnom Penh"
        }
    }
    alerts = AlertService.evaluate_graph_alerts("case-alerts-1", mock_graph)
    assert len(alerts) >= 2
    severities = [a["severity"] for a in alerts]
    assert "CRITICAL" in severities
