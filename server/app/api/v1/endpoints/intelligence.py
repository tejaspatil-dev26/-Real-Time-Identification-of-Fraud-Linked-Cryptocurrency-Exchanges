from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles
from app.models.case import Case
from app.services.intelligence_service import IntelligenceService
from app.services.neo4j_service import Neo4jService

router = APIRouter(prefix="/intelligence", tags=["Intelligence & AI Analytics"])

class CopilotQueryRequest(BaseModel):
    case_id: str
    prompt: str

class SanctionsScreenRequest(BaseModel):
    wallet_addresses: List[str]

class FreezeMandateRequest(BaseModel):
    vasp_name: str
    deposit_address: str
    absorbed_usd: float

@router.post("/copilot-query")
async def copilot_chat_with_graph(
    req: CopilotQueryRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Natural Language 'Chat with the Graph' query engine for live forensic intelligence."""
    graph_data = Neo4jService.get_graph_by_id(req.case_id)
    if not graph_data:
        graph_data = await Neo4jService.ingest_investigation_graph(
            task_id=f"auto_{req.case_id}",
            case_id=req.case_id,
            seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            network="ETHEREUM",
            max_depth=5
        )

    return IntelligenceService.query_ai_copilot(
        case_id=req.case_id,
        prompt=req.prompt,
        graph_data=graph_data
    )

@router.get("/{case_id}/predictive-offramp")
async def get_predictive_offramp_probabilities(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Predicts next terminal VASP cash-out probability distribution using ML."""
    graph_data = Neo4jService.get_graph_by_id(case_id)
    return IntelligenceService.predict_offramp_probabilities(case_id, graph_data)

@router.post("/sanctions-screen")
async def screen_wallets_sanctions(
    req: SanctionsScreenRequest,
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Screens wallet addresses against the US Treasury OFAC Specially Designated Nationals list."""
    return IntelligenceService.screen_wallets_ofac(req.wallet_addresses)

@router.get("/multi-chain-trace")
async def trace_multi_chain_graph(
    case_id: str = Query(...),
    chain: str = Query(default="TRON", pattern="^(TRON|BITCOIN|SOLANA|ETHEREUM)$"),
    seed_wallet: str = Query(default=""),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Generates topological forensic trace graph for non-EVM chains (Tron TRC-20, Bitcoin UTXO, Solana)."""
    return IntelligenceService.generate_multi_chain_graph(chain, seed_wallet, case_id)

@router.get("/threat-intel")
async def get_threat_intel_wiki(
    query: Optional[str] = Query(None),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    """Fetches threat actor intelligence wiki entries (APT-44, Lazarus, LockBit, Phishing syndicates)."""
    return IntelligenceService.get_threat_intel_wiki(query)

@router.post("/{case_id}/freeze-mandate")
async def generate_digital_freeze_mandate(
    case_id: str,
    req: FreezeMandateRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    """Generates a court-admissible digital asset preservation mandate citing 18 U.S.C. § 981."""
    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    case_number = case.case_number if case else "CASE-UNKNOWN"
    investigator_email = claims.get("email", "agent.smith@fbi.gov")

    return IntelligenceService.generate_digital_freeze_mandate(
        case_id=case_id,
        case_number=case_number,
        vasp_name=req.vasp_name,
        deposit_address=req.deposit_address,
        absorbed_usd=req.absorbed_usd,
        investigator_email=investigator_email
    )
