import pytest
from app.services.mixer_service import MixerService

def test_mixer_pool_identification():
    tornado_10 = "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936"
    match = MixerService.is_mixer_address(tornado_10)
    assert match is not None
    assert match["protocol"] == "Tornado Cash"
    assert match["denomination"] == 10.0

def test_mixer_deanonymization_heuristics():
    depositor = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    analysis = MixerService.analyze_mixer_deanonymization(
        deposit_address=depositor,
        deposit_amount_eth=10.0,
        max_window_hours=72
    )

    assert "mixer_pool" in analysis
    assert "candidate_withdrawals" in analysis
    assert len(analysis["candidate_withdrawals"]) >= 1

    # Check top candidate metrics
    top_candidate = analysis["candidate_withdrawals"][0]
    assert "candidate_address" in top_candidate
    assert "probability_score" in top_candidate
    assert top_candidate["probability_score"] > 0.80
    assert "behavioral_heuristic_matches" in top_candidate
    assert len(top_candidate["behavioral_heuristic_matches"]) > 0
