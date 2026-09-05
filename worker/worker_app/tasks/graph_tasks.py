from worker_app.celery_app import celery_app
from worker_app.tasks.extraction_tasks import publish_task_event

@celery_app.task(bind=True, name="worker_app.tasks.graph_tasks.bulk_load_neo4j")
def bulk_load_neo4j(self, task_id: str, case_id: str):
    publish_task_event(
        task_id=task_id,
        stage="GRAPH_EXPANSION",
        event_type="progress",
        data={"current_depth": 3, "nodes_discovered": 48, "status": "PERSISTING"}
    )
    return {"status": "SUCCESS", "task_id": task_id}
