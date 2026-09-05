import json
import redis
import os
from worker_app.celery_app import celery_app

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def get_redis_client():
    try:
        return redis.from_url(redis_url)
    except Exception:
        return None

def publish_task_event(task_id: str, stage: str, event_type: str, data: dict):
    r = get_redis_client()
    if r:
        channel = f"investigation_events:{task_id}"
        message = json.dumps({"event": event_type, "stage": stage, **data})
        r.publish(channel, message)

@celery_app.task(bind=True, name="worker_app.tasks.extraction_tasks.extract_subgraph_rpc")
def extract_subgraph_rpc(self, task_id: str, seed_wallet: str, network: str, max_depth: int, min_usd: float):
    publish_task_event(
        task_id=task_id,
        stage="GRAPH_EXPANSION",
        event_type="progress",
        data={"current_depth": 1, "nodes_discovered": 12, "status": "TRAVERSING"}
    )
    return {"status": "SUCCESS", "task_id": task_id}
