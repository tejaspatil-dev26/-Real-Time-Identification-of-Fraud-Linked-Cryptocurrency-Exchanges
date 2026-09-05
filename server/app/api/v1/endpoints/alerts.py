from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.core.security import require_roles
from app.services.alert_service import AlertService
from app.services.neo4j_service import Neo4jService

router = APIRouter(prefix="/alerts", tags=["Real-Time Monitoring & Anomaly Alerts"])

class WebhookDispatchRequest(BaseModel):
    vasp_name: str
    target_address: str

@router.get("/{case_id}")
async def get_case_alerts(
    case_id: str,
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Retrieves real-time forensic alerts (high-value transfers, dormant wallet awakenings, geographic anomalies)."""
    graph_data = Neo4jService.get_graph_by_id(case_id)
    return AlertService.evaluate_graph_alerts(case_id, graph_data)

@router.post("/{case_id}/dispatch-webhook")
async def dispatch_vasp_alert_webhook(
    case_id: str,
    req: WebhookDispatchRequest,
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    """Dispatches an emergency automated webhook alert to a partnered VASP compliance desk."""
    return AlertService.dispatch_vasp_webhook(case_id, req.vasp_name, req.target_address)
