import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, String
from app.core.database import Base

class RiskLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    BENIGN = "BENIGN"

class VASPEntity(Base):
    __tablename__ = "vasp_entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vasp_name = Column(String(150), unique=True, nullable=False, index=True)
    legal_entity_name = Column(String(255), nullable=True)
    jurisdiction_code = Column(String(3), nullable=True) # ISO 3166-1 alpha-3
    risk_level = Column(Enum(RiskLevel), nullable=False, default=RiskLevel.LOW)
    compliance_email = Column(String(255), nullable=True)
    travel_rule_compliant = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
