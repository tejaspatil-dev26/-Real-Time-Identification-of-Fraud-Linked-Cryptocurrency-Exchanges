import pytest
from app.services.neo4j_service import Neo4jService

def test_threat_matrix_scoring_algorithm():
    nodes = [
        {
            "id": "suspect-seed",
            "label": "SEED WALLET",
            "is_seed": True,
            "balance": 15.0,
            "risk_score": 0.95,
            "hop_depth": 0,
            "peel_chain_detected": False
        },
        {
            "id": "mixer-node",
            "label": "Mixer Pool Interaction",
            "is_seed": False,
            "balance": 10.0,
            "risk_score": 0.90,
            "hop_depth": 2,
            "mixer_interaction": True,
            "peel_chain_detected": True
        },
        {
            "id": "benign-wallet",
            "label": "Standard Wallet",
            "is_seed": False,
            "balance": 0.05,
            "risk_score": 0.10,
            "hop_depth": 1,
            "peel_chain_detected": False
        }
    ]
    edges = [
        {"source": "suspect-seed", "target": "mixer-node", "amount_usd": 30000.0},
        {"source": "suspect-seed", "target": "benign-wallet", "amount_usd": 150.0}
    ]

    rankings = Neo4jService.calculate_threat_matrix(nodes, edges)

    assert len(rankings) == 3
    # Check that entries are sorted descending by threat score
    assert rankings[0]["threat_score"] >= rankings[1]["threat_score"]
    assert rankings[1]["threat_score"] >= rankings[2]["threat_score"]

    # Verify seed and mixer nodes have high threat scores
    top_addr = rankings[0]["address"]
    assert top_addr in ["suspect-seed", "mixer-node"]
    assert rankings[0]["threat_score"] >= 80.0
    assert rankings[0]["priority_rank"] == "CRITICAL_SEIZURE_TARGET"

    # Verify benign wallet has lower threat score
    assert rankings[2]["threat_score"] < 50.0
