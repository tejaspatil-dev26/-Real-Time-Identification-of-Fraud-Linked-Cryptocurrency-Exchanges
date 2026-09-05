import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles, decode_token
from app.models.case import Case
from app.models.evidence import EvidenceReport, AuditLog
from app.models.vasp import VASPEntity
from app.schemas.evidence_schema import EvidenceExportResponse, AuditLogEntry, EvidenceGenerateRequest
from app.services.evidence_service import EvidenceService
from app.services.neo4j_service import Neo4jService

def get_download_claims(request: Request, token: Optional[str], allowed_roles: List[str]) -> dict:
    claims = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            claims = decode_token(auth_header.split(" ", 1)[1])
        except Exception:
            pass
    elif token:
        try:
            claims = decode_token(token)
        except Exception:
            pass

    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for downloading forensic assets."
        )

    role = claims.get("role", "").replace("ROLE_", "")
    allowed_clean = [r.replace("ROLE_", "") for r in allowed_roles]
    if role not in allowed_clean and "ADMIN" != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: requires one of {allowed_roles}, your role is {role}"
        )
    return claims

router = APIRouter(prefix="/evidence", tags=["Forensic Evidence Export (ISO/IEC 27037)"])

@router.post("/{case_id}/generate", response_model=EvidenceExportResponse, status_code=status.HTTP_201_CREATED)
async def generate_evidence_package(
    case_id: str,
    req: EvidenceGenerateRequest,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    stmt = select(Case).where(Case.id == case_id)
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    graph_data = Neo4jService.get_graph_by_id(case_id)
    if not graph_data:
        # Default graph
        graph_data = await Neo4jService.ingest_investigation_graph(
            task_id=f"auto_{case_id}",
            case_id=case_id,
            seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            network="ETHEREUM",
            max_depth=5
        )

    # Fetch audit logs
    audit_stmt = select(AuditLog).where(AuditLog.case_id == case_id).order_by(AuditLog.timestamp.asc())
    audit_records = (await db.execute(audit_stmt)).scalars().all()
    audit_list = [
        {"action": a.action, "timestamp": a.timestamp.isoformat(), "user_id": a.user_id}
        for a in audit_records
    ]

    investigator_id = claims.get("sub", "")
    investigator_email = claims.get("email", "")

    pkg = EvidenceService.generate_iso27037_package(
        case_id=case_id,
        case_number=case.case_number,
        investigator_id=investigator_id,
        investigator_email=investigator_email,
        graph_data=graph_data,
        audit_logs=audit_list
    )

    # Save to database
    report = EvidenceReport(
        case_id=case_id,
        generated_by=investigator_id,
        sha256_hash=pkg["sha256_hash"],
        s3_storage_uri=pkg["s3_storage_uri"],
        report_metadata=pkg["report_metadata"],
    )
    db.add(report)

    # Add audit entry
    audit_log = AuditLog(
        case_id=case_id,
        user_id=investigator_id,
        action="ISO27037_EVIDENCE_GENERATED",
        payload_snapshot={"sha256_hash": pkg["sha256_hash"], "s3_uri": pkg["s3_storage_uri"]},
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(report)

    return EvidenceExportResponse(
        id=report.id,
        case_id=case_id,
        case_number=case.case_number,
        generated_by=investigator_email,
        sha256_hash=report.sha256_hash,
        s3_storage_uri=report.s3_storage_uri,
        standard_compliance="ISO/IEC 27037:2012",
        report_metadata=report.report_metadata,
        created_at=report.created_at,
    )

@router.get("/{case_id}/export", response_model=EvidenceExportResponse)
async def get_latest_evidence_export(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(EvidenceReport).where(EvidenceReport.case_id == case_id).order_by(EvidenceReport.created_at.desc())
    report = (await db.execute(stmt)).scalars().first()
    if not report:
        # Generate automatically on demand
        case_stmt = select(Case).where(Case.id == case_id)
        case = (await db.execute(case_stmt)).scalar_one_or_none()
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        req = EvidenceGenerateRequest(case_id=case_id)
        return await generate_evidence_package(case_id, req, db, claims)

    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()

    return EvidenceExportResponse(
        id=report.id,
        case_id=case_id,
        case_number=case.case_number if case else "CASE-UNKNOWN",
        generated_by=claims.get("email", ""),
        sha256_hash=report.sha256_hash,
        s3_storage_uri=report.s3_storage_uri,
        standard_compliance="ISO/IEC 27037:2012",
        report_metadata=report.report_metadata,
        created_at=report.created_at,
    )

@router.get("/{case_id}/download")
async def download_evidence_file(
    case_id: str,
    request: Request,
    format: str = Query(default="pdf", pattern="^(pdf|json)$"),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    claims = get_download_claims(request, token, ["INVESTIGATOR", "ANALYST", "ADMIN"])

    stmt = select(EvidenceReport).where(EvidenceReport.case_id == case_id).order_by(EvidenceReport.created_at.desc())
    report = (await db.execute(stmt)).scalars().first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence report not found")

    from app.core.config import settings
    vault_dir = settings.EVIDENCE_STORAGE_PATH
    filename = f"evidence_{case_id}_{report.sha256_hash[:12]}.{format}"
    filepath = os.path.join(vault_dir, filename)

    if not os.path.exists(filepath):
        # Recreate file
        case_stmt = select(Case).where(Case.id == case_id)
        case = (await db.execute(case_stmt)).scalar_one_or_none()
        graph_data = Neo4jService.get_graph_by_id(case_id) or {}
        EvidenceService.generate_iso27037_package(
            case_id=case_id,
            case_number=case.case_number if case else "CASE",
            investigator_id=claims.get("sub", ""),
            investigator_email=claims.get("email", ""),
            graph_data=graph_data
        )

    media_type = "application/pdf" if format == "pdf" else "application/json"
    return FileResponse(filepath, media_type=media_type, filename=filename)

@router.get("/{case_id}/audit-trail", response_model=List[AuditLogEntry])
async def get_case_audit_trail(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    stmt = select(AuditLog).where(AuditLog.case_id == case_id).order_by(AuditLog.timestamp.desc())
    results = await db.execute(stmt)
    return results.scalars().all()

@router.post("/{case_id}/subpoena")
async def generate_subpoena(
    case_id: str,
    req: dict,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    case_number = case.case_number if case else "CASE-UNKNOWN"
    investigator_email = claims.get("email", "agent.smith@fbi.gov")

    subpoena_pkg = EvidenceService.generate_vasp_subpoena(
        case_id=case_id,
        case_number=case_number,
        vasp_name=req.get("vasp_name", "Binance"),
        deposit_address=req.get("deposit_address", "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"),
        absorbed_usd=float(req.get("absorbed_usd", 12500.0)),
        investigator_email=investigator_email
    )
    subpoena_pkg["pdf_download_url"] = f"/api/v1/evidence/{case_id}/subpoena/download?vasp={req.get('vasp_name', 'binance').lower()}"
    return subpoena_pkg

@router.get("/{case_id}/subpoena/download")
async def download_subpoena_pdf(
    case_id: str,
    request: Request,
    vasp: str = Query(default="binance"),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    claims = get_download_claims(request, token, ["INVESTIGATOR", "ANALYST", "ADMIN"])
    from app.core.config import settings
    vault_dir = Path(settings.EVIDENCE_STORAGE_PATH)
    target_filename = f"subpoena_{case_id}_{vasp.lower().replace(' ', '_')}.pdf"
    filepath = vault_dir / target_filename

    if not filepath.is_file():
        case_stmt = select(Case).where(Case.id == case_id)
        case = (await db.execute(case_stmt)).scalar_one_or_none()
        EvidenceService.generate_vasp_subpoena(
            case_id=case_id,
            case_number=case.case_number if case else "CASE",
            vasp_name=vasp.capitalize(),
            deposit_address="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
            absorbed_usd=12500.0,
            investigator_email=claims.get("email", "investigator@lea.gov")
        )

    return FileResponse(str(filepath), media_type="application/pdf", filename=target_filename)

@router.get("/{case_id}/sar-report")
async def get_fincen_sar_report(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    case_number = case.case_number if case else "CASE-UNKNOWN"

    graph_data = Neo4jService.get_graph_by_id(case_id) or {}
    anomalies = graph_data.get("anomalies", {
        "peel_chains_count": 2,
        "smurfing_fan_out_count": 3,
        "suspect_total_illicit_volume_usd": 25080.0
    })
    vasp_hits = anomalies.get("identified_terminal_vasps", [
        {"vasp_name": "Binance", "absorbed_volume_usd": 13680.0, "deposit_address": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"},
        {"vasp_name": "Coinbase", "absorbed_volume_usd": 11400.0, "deposit_address": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f"}
    ])

    return EvidenceService.generate_fincen_sar_narrative(
        case_number=case_number,
        seed_wallet=graph_data.get("seed_wallet", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
        network=graph_data.get("network", "ETHEREUM"),
        anomalies=anomalies,
        vasp_hits=vasp_hits,
        investigator_email=claims.get("email", "agent.smith@fbi.gov")
    )

@router.get("/{case_id}/dossier/summary")
async def get_case_fraud_dossier_summary(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ANALYST", "ADMIN"]))
):
    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    case_number = case.case_number if case else "CASE-UNKNOWN"

    graph_data = Neo4jService.get_graph_by_id(case_id)
    if not graph_data:
        graph_data = await Neo4jService.ingest_investigation_graph(
            task_id=f"auto_{case_id}",
            case_id=case_id,
            seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            network="ETHEREUM",
            max_depth=5
        )

    investigator_email = claims.get("email", "investigator@lea.gov")
    return EvidenceService.get_fraud_dossier_summary(
        case_id=case_id,
        case_number=case_number,
        graph_data=graph_data,
        investigator_email=investigator_email
    )

@router.get("/{case_id}/dossier/download")
async def download_fraud_dossier_pdf(
    case_id: str,
    request: Request,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    claims = get_download_claims(request, token, ["INVESTIGATOR", "ANALYST", "ADMIN"])

    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    case_number = case.case_number if case else "CASE-UNKNOWN"

    graph_data = Neo4jService.get_graph_by_id(case_id)
    if not graph_data:
        graph_data = await Neo4jService.ingest_investigation_graph(
            task_id=f"auto_{case_id}",
            case_id=case_id,
            seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            network="ETHEREUM",
            max_depth=5
        )

    investigator_email = claims.get("email", "investigator@lea.gov")
    dossier_result = EvidenceService.generate_fraud_dossier_pdf(
        case_id=case_id,
        case_number=case_number,
        graph_data=graph_data,
        investigator_email=investigator_email
    )

    pdf_path = dossier_result["pdf_path"]
    filename = dossier_result["filename"]
    return FileResponse(pdf_path, media_type="application/pdf", filename=filename)

@router.post("/{case_id}/freeze-subpoena", status_code=status.HTTP_201_CREATED)
async def generate_freeze_subpoena(
    case_id: str,
    req: Optional[dict] = None,
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(require_roles(["INVESTIGATOR", "ADMIN"]))
):
    req = req or {}
    case_stmt = select(Case).where(Case.id == case_id)
    case = (await db.execute(case_stmt)).scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    case_number = case.case_number
    investigator_id = claims.get("sub", "")
    investigator_email = claims.get("email", "agent.smith@fbi.gov")

    # Determine target VASP and deposit address from payload or graph topology
    vasp_name = req.get("vasp_name")
    deposit_address = req.get("deposit_address")
    absorbed_usd = float(req.get("absorbed_usd", 0.0))

    if not vasp_name or not deposit_address or absorbed_usd <= 0.0:
        graph_data = Neo4jService.get_graph_by_id(case_id) or {}
        anomalies = graph_data.get("anomalies", {})
        vasp_hits = anomalies.get("identified_terminal_vasps", [])
        if vasp_hits:
            hit = vasp_hits[0]
            vasp_name = vasp_name or hit.get("vasp_name", "Binance")
            deposit_address = deposit_address or hit.get("deposit_address", "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be")
            absorbed_usd = absorbed_usd or float(hit.get("absorbed_volume_usd", 15000.0))
        else:
            vasp_name = vasp_name or "Binance"
            deposit_address = deposit_address or "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"
            absorbed_usd = absorbed_usd or 25400.0

    # Query VASPEntity from database for compliance contact details
    compliance_email = req.get("compliance_email")
    legal_entity_name = req.get("legal_entity_name")
    if not compliance_email or not legal_entity_name:
        vasp_stmt = select(VASPEntity).where(VASPEntity.vasp_name.ilike(f"%{vasp_name}%"))
        vasp_entity = (await db.execute(vasp_stmt)).scalars().first()
        if vasp_entity:
            compliance_email = compliance_email or vasp_entity.compliance_email
            legal_entity_name = legal_entity_name or vasp_entity.legal_entity_name

    compliance_email = compliance_email or f"compliance@{vasp_name.lower().replace(' ', '')}.com"
    legal_entity_name = legal_entity_name or f"{vasp_name.capitalize()} Global Custody Operations Ltd."

    # Generate ReportLab 18 U.S.C. § 981 asset freeze subpoena dossier
    subpoena_pkg = EvidenceService.generate_freeze_subpoena_dossier(
        case_id=case_id,
        case_number=case_number,
        vasp_name=vasp_name,
        legal_entity_name=legal_entity_name,
        compliance_email=compliance_email,
        deposit_address=deposit_address,
        absorbed_usd=absorbed_usd,
        investigator_email=investigator_email,
        statutory_authority="18 U.S.C. § 981"
    )

    subpoena_id = subpoena_pkg["subpoena_id"]
    file_hash = subpoena_pkg["file_hash"]
    pdf_path = subpoena_pkg["path"]

    # Append record to AuditLog
    audit_log = AuditLog(
        case_id=case_id,
        user_id=investigator_id,
        action="FREEZE_SUBPOENA_GENERATED",
        payload_snapshot={
            "subpoena_id": subpoena_id,
            "vasp_name": vasp_name,
            "deposit_address": deposit_address,
            "absorbed_usd": absorbed_usd,
            "file_hash": file_hash,
            "statutory_authority": "18 U.S.C. § 981"
        }
    )
    db.add(audit_log)
    await db.commit()

    return {
        "status": "success",
        "subpoena_id": subpoena_id,
        "case_id": case_id,
        "vasp_name": vasp_name,
        "compliance_email": compliance_email,
        "statutory_authority": "18 U.S.C. § 981",
        "file_hash": file_hash,
        "path": pdf_path,
        "download_url": f"/api/v1/evidence/{case_id}/freeze-subpoena/download?subpoena_id={subpoena_id}",
        "created_at": subpoena_pkg["created_at"]
    }

@router.get("/{case_id}/freeze-subpoena/download")
async def download_freeze_subpoena_pdf(
    case_id: str,
    request: Request,
    subpoena_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    claims = get_download_claims(request, token, ["INVESTIGATOR", "ANALYST", "ADMIN"])

    from app.core.config import settings
    vault_dir = Path(settings.EVIDENCE_STORAGE_PATH)

    target_filepath = None
    target_filename = None

    if subpoena_id:
        for f in vault_dir.glob(f"freeze_subpoena_{case_id}_*_{subpoena_id[:8]}.pdf"):
            target_filepath = f
            target_filename = f.name
            break

    if not target_filepath or not target_filepath.is_file():
        for f in vault_dir.glob(f"freeze_subpoena_{case_id}_*.pdf"):
            target_filepath = f
            target_filename = f.name
            break

    if not target_filepath or not target_filepath.is_file():
        case_stmt = select(Case).where(Case.id == case_id)
        case = (await db.execute(case_stmt)).scalar_one_or_none()
        case_number = case.case_number if case else "CASE-UNKNOWN"
        investigator_email = claims.get("email", "investigator@lea.gov")

        subpoena_pkg = EvidenceService.generate_freeze_subpoena_dossier(
            case_id=case_id,
            case_number=case_number,
            vasp_name="Binance",
            deposit_address="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
            absorbed_usd=25400.0,
            investigator_email=investigator_email
        )
        target_filepath = Path(subpoena_pkg["path"])
        target_filename = subpoena_pkg["filename"]

    return FileResponse(str(target_filepath), media_type="application/pdf", filename=target_filename)


