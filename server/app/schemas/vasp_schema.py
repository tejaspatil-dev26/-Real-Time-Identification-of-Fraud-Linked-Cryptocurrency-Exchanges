from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class VASPCreate(BaseModel):
    vasp_name: str = Field(..., min_length=2, max_length=150)
    legal_entity_name: Optional[str] = None
    jurisdiction_code: Optional[str] = Field(None, min_length=2, max_length=3)
    risk_level: str = "LOW"
    compliance_email: Optional[str] = None
    travel_rule_compliant: bool = True

class VASPResponse(VASPCreate):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

