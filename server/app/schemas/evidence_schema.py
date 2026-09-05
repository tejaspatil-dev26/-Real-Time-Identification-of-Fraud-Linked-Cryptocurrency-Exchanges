from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class EvidenceGenerateRequest(BaseModel):
    case_id: str
    include_graph_topology: bool = True
    include_gnn_explainability: bool = True
    export_format: str = "JSON" # "JSON" or "PDF"

class EvidenceExportResponse(BaseModel):
    id: str
    case_id: str
    case_number: str
    generated_by: str
    sha256_hash: str
    s3_storage_uri: str
    standard_compliance: str = "ISO/IEC 27037:2012"
    report_metadata: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogEntry(BaseModel):
    id: int
    case_id: Optional[str]
    user_id: Optional[str]
    action: str
    payload_snapshot: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class SubpoenaRequest(BaseModel):
    vasp_name: str
    deposit_address: str
    absorbed_usd: float

class SubpoenaResponse(BaseModel):
    case_id: str
    case_number: str
    vasp_name: str
    deposit_address: str
    absorbed_usd: float
    subpoena_text: str
    pdf_download_url: str
    generated_at: str

class FincenSarResponse(BaseModel):
    case_number: str
    sar_narrative: str
    filing_date: str
    total_reported_usd: float
    terminal_vasps_count: int


