from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.neo4j_service import Neo4jService

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])

@router.get("/db-sql")
async def check_sql_database(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "HEALTHY", "database": "SQL_RELATIONAL", "code": 200}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Relational database unhealthy: {str(e)}"
        )

@router.get("/db-graph")
async def check_graph_database():
    is_healthy = await Neo4jService.check_health()
    if is_healthy:
        return {"status": "HEALTHY", "database": "NEO4J_GRAPH", "code": 200}
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Graph database cluster unreachable"
    )

@router.get("/liveness")
async def liveness_check():
    return {"status": "OK", "service": "crypto-forensics-platform", "version": "1.0.0"}
