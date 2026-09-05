from fastapi import APIRouter
from app.api.v1.endpoints import auth, cases, investigations, graph, vasp, evidence, health, intelligence, alerts, copilot_live

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth.router)
api_router.include_router(cases.router)
api_router.include_router(investigations.router)
api_router.include_router(graph.router)
api_router.include_router(vasp.router)
api_router.include_router(evidence.router)
api_router.include_router(intelligence.router)
api_router.include_router(alerts.router)
api_router.include_router(copilot_live.router)
api_router.include_router(health.router)


