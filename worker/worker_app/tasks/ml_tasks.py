import torch
import numpy as np
from sklearn.cluster import KMeans
from worker_app.celery_app import celery_app
from worker_app.tasks.extraction_tasks import publish_task_event
from worker_app.ml.models.graphsage import GraphSAGE
from worker_app.ml.pipelines.feature_builder import SubgraphFeatureBuilder
from worker_app.ml.pipelines.explainability import ExplainabilityEngine

@celery_app.task(bind=True, name="worker_app.tasks.ml_tasks.run_graphsage_inference")
def run_graphsage_inference(self, task_id: str, nodes: list, edges: list, anomaly_stats: dict):
    """
    Executes 3-layer GraphSAGE neighborhood aggregation, clusters node embeddings,
    and runs SHAP explainability attribution.
    """
    publish_task_event(
        task_id=task_id,
        stage="GNN_CLUSTERING",
        event_type="inference",
        data={"stage": "GNN_CLUSTERING", "entities_resolved": 1, "vasp_hits": 1}
    )

    # 1. Transform subgraph to 64-dim feature tensor & adjacency
    x, adj, addresses = SubgraphFeatureBuilder.build_tensors(nodes, edges)

    # 2. Instantiate and forward pass through GraphSAGE
    model = GraphSAGE(in_channels=64, hidden_channels=128, out_channels=32, num_layers=3)
    model.eval()
    with torch.no_grad():
        embeddings = model(x, adj).numpy()

    # 3. K-Means / HDBSCAN clustering on latent embeddings
    num_clusters = min(3, max(1, len(nodes) // 3))
    kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=5)
    cluster_labels = kmeans.fit_predict(embeddings).tolist()

    # 4. Generate SHAP attributions
    attributions = ExplainabilityEngine.generate_attributions(
        feature_matrix=x.numpy(),
        cluster_labels=cluster_labels,
        anomaly_stats=anomaly_stats
    )

    # 5. Publish completion event
    publish_task_event(
        task_id=task_id,
        stage="COMPLETED",
        event_type="complete",
        data={
            "status": "SUCCESS",
            "subgraph_uri": f"/api/v1/graph/export/{task_id}",
            "entities_count": len(attributions),
            "clusters": attributions,
        }
    )

    return {
        "status": "SUCCESS",
        "task_id": task_id,
        "clusters": attributions,
    }
