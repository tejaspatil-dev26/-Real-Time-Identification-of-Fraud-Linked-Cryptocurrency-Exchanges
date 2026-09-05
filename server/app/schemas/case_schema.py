from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class SuspectWalletBase(BaseModel):
    address: str
    network: str = "ETHEREUM"
    reported_victim_loss_usd: Optional[float] = 0.0

class SuspectWalletResponse(SuspectWalletBase):
    id: str
    case_id: str
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    seed_wallet: Optional[str] = None
    network: Optional[str] = "ETHEREUM"
    reported_victim_loss_usd: Optional[float] = 0.0

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    description: Optional[str]
    status: str
    primary_investigator_id: str
    created_at: datetime
    updated_at: datetime
    suspect_wallets: List[SuspectWalletResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InvestigationDispatchRequest(BaseModel):
    case_id: str
    seed_wallet: str
    network: str = "ETHEREUM"
    max_depth: int = Field(default=5, ge=1, le=6)
    min_usd_threshold: float = Field(default=500.0, ge=0.0)

class InvestigationDispatchResponse(BaseModel):
    task_id: str
    status: str = "QUEUED"
    event_stream: str
