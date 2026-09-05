import sys
from pathlib import Path
import pytest
import torch
import numpy as np

# Add worker to path
worker_dir = Path(__file__).resolve().parent.parent.parent / "worker"
sys.path.insert(0, str(worker_dir))

from worker_app.ml.models.graphsage import GraphSAGE
from worker_app.ml.pipelines.feature_builder import SubgraphFeatureBuilder
from worker_app.ml.pipelines.explainability import ExplainabilityEngine

def test_subgraph_feature_builder():
    nodes = [
        {"data": {"id": "w1", "balance": 10.0, "risk_score": 0.9, "is_seed": True, "hop_depth": 0}},
        {"data": {"id": "w2", "balance": 5.0, "risk_score": 0.8, "hop_depth": 1, "peel_chain_detected": True}},
        {"data": {"id": "w3", "balance": 1200.0, "type": "vasp", "vasp_name": "Binance", "hop_depth": 2}}
    ]
    edges = [
        {"data": {"source": "w1", "target": "w2", "amount": 8.0}},
        {"data": {"source": "w2", "target": "w3", "amount": 7.5}}
    ]

    x, adj, addresses = SubgraphFeatureBuilder.build_tensors(nodes, edges)

    # Verify tensor shapes
    assert x.shape == (3, 64), f"Expected shape (3, 64), got {x.shape}"
    assert adj.shape == (3, 3), f"Expected shape (3, 3), got {adj.shape}"
    assert len(addresses) == 3

    # Check that seed flag was set in feature column 7
    assert x[0, 7].item() == 1.0
    assert x[1, 7].item() == 0.0

def test_graphsage_forward_pass():
    # 3-layer GraphSAGE: 64 -> 128 -> 128 -> 32
    from worker_app.ml.models.graphsage import load_pretrained_graphsage
    model = load_pretrained_graphsage()
    x = torch.randn(4, 64)
    adj = torch.eye(4)

    embeddings = model(x, adj)
    assert embeddings.shape == (4, 32), f"Expected output embeddings of (4, 32), got {embeddings.shape}"


def test_shap_explainability_engine():
    feature_matrix = np.random.randn(6, 64)
    cluster_labels = [0, 0, 0, 1, 1, 1]
    anomaly_stats = {
        "peel_chains_count": 2,
        "smurfing_fan_out_count": 3,
        "suspect_total_illicit_volume_usd": 45000.0
    }

    attributions = ExplainabilityEngine.generate_attributions(
        feature_matrix=feature_matrix,
        cluster_labels=cluster_labels,
        anomaly_stats=anomaly_stats
    )

    assert len(attributions) == 2
    for attr in attributions:
        assert "shap_scores" in attr
        assert "peel_chain_score" in attr["shap_scores"]
        assert "top_attributions" in attr
        assert len(attr["top_attributions"]) <= 3
        assert "forensic_rationale" in attr
        assert len(attr["forensic_rationale"]) > 0
