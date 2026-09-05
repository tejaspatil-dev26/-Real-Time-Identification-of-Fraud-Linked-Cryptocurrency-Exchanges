from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles
from app.models.vasp import VASPEntity, RiskLevel
from app.schemas.vasp_schema import VASPCreate, VASPResponse

router = APIRouter(prefix="/vasp", tags=["VASP Registry"])

@router.get("/registry", response_model=List[VASPResponse])
async def list_vasps(
    search: Optional[str] = None,
    risk: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(VASPEntity).order_by(VASPEntity.vasp_name.asc())
    if risk:
        try:
            stmt = stmt.where(VASPEntity.risk_level == RiskLevel[risk.upper()])
        except KeyError:
            pass
    result = await db.execute(stmt)
    vasps = result.scalars().all()
    if search:
        s_lower = search.lower()
        vasps = [v for v in vasps if s_lower in v.vasp_name.lower() or (v.legal_entity_name and s_lower in v.legal_entity_name.lower())]
    return vasps

@router.post("/registry", response_model=VASPResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_vasp(
    vasp_in: VASPCreate,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["ANALYST", "ADMIN"]))
):
    stmt = select(VASPEntity).where(VASPEntity.vasp_name == vasp_in.vasp_name)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    try:
        risk_enum = RiskLevel[vasp_in.risk_level.upper()]
    except KeyError:
        risk_enum = RiskLevel.LOW

    if existing:
        existing.legal_entity_name = vasp_in.legal_entity_name
        existing.jurisdiction_code = vasp_in.jurisdiction_code
        existing.risk_level = risk_enum
        existing.compliance_email = vasp_in.compliance_email
        existing.travel_rule_compliant = vasp_in.travel_rule_compliant
        await db.commit()
        await db.refresh(existing)
        return existing

    new_vasp = VASPEntity(
        vasp_name=vasp_in.vasp_name,
        legal_entity_name=vasp_in.legal_entity_name,
        jurisdiction_code=vasp_in.jurisdiction_code,
        risk_level=risk_enum,
        compliance_email=vasp_in.compliance_email,
        travel_rule_compliant=vasp_in.travel_rule_compliant,
    )
    db.add(new_vasp)
    await db.commit()
    await db.refresh(new_vasp)
    return new_vasp
