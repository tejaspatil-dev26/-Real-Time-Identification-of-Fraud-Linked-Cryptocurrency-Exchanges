import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user_claims, require_roles
from app.models.case import Case, CaseStatus, CryptoNetwork, SuspectWallet
from app.models.evidence import AuditLog
from app.schemas.case_schema import CaseCreate, CaseResponse, CaseUpdate
from app.services.rpc_client import RPCClient

router = APIRouter(prefix="/cases", tags=["Case Management"])

@router.get("", response_model=List[CaseResponse])
async def list_cases(
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(Case).order_by(Case.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_in: CaseCreate,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    investigator_id = claims.get("sub")
    case_num = f"CASE-{uuid.uuid4().hex[:8].upper()}"

    new_case = Case(
        case_number=case_num,
        title=case_in.title,
        description=case_in.description,
        status=CaseStatus.ACTIVE,
        primary_investigator_id=investigator_id,
    )
    db.add(new_case)
    await db.flush()

    # If seed wallet was provided in the intake
    if case_in.seed_wallet:
        net_str = (case_in.network or "ETHEREUM").upper()
        is_valid, err_msg = RPCClient.validate_crypto_address(case_in.seed_wallet, net_str)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

        network_enum = CryptoNetwork[net_str]
        wallet = SuspectWallet(
            case_id=new_case.id,
            address=case_in.seed_wallet.strip(),
            network=network_enum,
            reported_victim_loss_usd=case_in.reported_victim_loss_usd or 0.0,
        )
        db.add(wallet)

    # Add audit trail entry
    audit = AuditLog(
        case_id=new_case.id,
        user_id=investigator_id,
        action="CASE_CREATED",
        payload_snapshot={"title": new_case.title, "case_number": case_num, "seed_wallet": case_in.seed_wallet},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_case)
    return new_case

@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(Case).where(Case.id == case_id)
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case

@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    update_in: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(Case).where(Case.id == case_id)
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    if update_in.title is not None:
        case.title = update_in.title
    if update_in.description is not None:
        case.description = update_in.description
    if update_in.status is not None:
        try:
            case.status = CaseStatus[update_in.status]
        except KeyError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {update_in.status}")

    audit = AuditLog(
        case_id=case.id,
        user_id=claims.get("sub"),
        action="CASE_UPDATED",
        payload_snapshot=update_in.model_dump(exclude_unset=True),
    )
    db.add(audit)
    await db.commit()
    await db.refresh(case)
    return case
