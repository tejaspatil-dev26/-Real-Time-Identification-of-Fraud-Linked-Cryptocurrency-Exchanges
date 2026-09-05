import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class ClusterCategory(str, enum.Enum):
    MIXER = "MIXER"
    SCAM_SYNDICATE = "SCAM_SYNDICATE"
    RANSOMWARE = "RANSOMWARE"
    EXCHANGE = "EXCHANGE"
    DARKNET_MARKET = "DARKNET_MARKET"
    UNKNOWN = "UNKNOWN"

class EntityCluster(Base):
    __tablename__ = "entity_clusters"

    cluster_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    primary_category = Column(Enum(ClusterCategory), nullable=False, default=ClusterCategory.UNKNOWN)
    risk_score = Column(Float, nullable=False, default=0.0)
    wallet_addresses = Column(JSON, nullable=False, default=list)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    case = relationship("Case", back_populates="entity_clusters")

class CrossChainBridgeEvent(Base):
    __tablename__ = "cross_chain_bridge_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_chain = Column(String(50), nullable=False)
    dest_chain = Column(String(50), nullable=False)
    usd_value = Column(Float, nullable=False, default=0.0)
    source_tx_hash = Column(String(128), nullable=False, index=True)
    dest_tx_hash = Column(String(128), nullable=False)
    source_wallet = Column(String(128), nullable=False, index=True)
    dest_wallet = Column(String(128), nullable=False, index=True)
    bridge_protocol = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
