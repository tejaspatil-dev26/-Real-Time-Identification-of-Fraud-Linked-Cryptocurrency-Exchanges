import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class CaseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING_ANALYSIS = "PENDING_ANALYSIS"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"

class CryptoNetwork(str, enum.Enum):
    BITCOIN = "BITCOIN"
    ETHEREUM = "ETHEREUM"
    POLYGON = "POLYGON"
    TRON = "TRON"

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(CaseStatus), nullable=False, default=CaseStatus.ACTIVE)
    primary_investigator_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    suspect_wallets = relationship("SuspectWallet", back_populates="case", cascade="all, delete-orphan", lazy="selectin")
    evidence_reports = relationship("EvidenceReport", back_populates="case", cascade="all, delete-orphan", lazy="selectin")
    entity_clusters = relationship("EntityCluster", back_populates="case", lazy="selectin")

class SuspectWallet(Base):
    __tablename__ = "suspect_wallets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    address = Column(String(128), nullable=False, index=True)
    network = Column(Enum(CryptoNetwork), nullable=False)
    reported_victim_loss_usd = Column(Numeric(18, 2), nullable=True, default=0.0)
    added_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("case_id", "address", "network", name="uq_case_wallet"),
    )

    case = relationship("Case", back_populates="suspect_wallets")
