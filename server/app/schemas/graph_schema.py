from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class GraphNodeData(BaseModel):
    id: str
    label: str
    type: str = "wallet" # "wallet", "transaction", "vasp", "entity"
    address: Optional[str] = None
    network: Optional[str] = None
    balance: Optional[float] = 0.0
    risk_score: Optional[float] = 0.0
    is_contract: Optional[bool] = False
    is_seed: Optional[bool] = False
    cluster_id: Optional[str] = None
    vasp_name: Optional[str] = None
    vasp_risk: Optional[str] = None
    hop_depth: Optional[int] = 0
    peel_chain_detected: Optional[bool] = False
    fan_out_detected: Optional[bool] = False
    fan_in_detected: Optional[bool] = False

class GraphNode(BaseModel):
    data: GraphNodeData

class GraphEdgeData(BaseModel):
    id: str
    source: str
    target: str
    tx_hash: Optional[str] = None
    amount: float
    amount_usd: Optional[float] = None
    timestamp: Optional[str] = None
    token: str = "ETH"
    is_peel_chain: Optional[bool] = False
    is_split: Optional[bool] = False

class GraphEdge(BaseModel):
    data: GraphEdgeData

class CytoscapeGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any] = Field(default_factory=dict)

class EntityCluster(BaseModel):
    entity_id: str
    cluster_label: str
    confidence_score: float
    algorithm: str = "GraphSAGE+HDBSCAN"
    wallet_count: int
    total_volume_usd: float
    vasp_cashout_hits: List[str] = []
    shap_attributions: Dict[str, float] = {}
    wallets: List[str] = []

class AnomalyTypologyReport(BaseModel):
    peel_chains_count: int
    smurfing_fan_out_count: int
    fan_in_consolidation_count: int
    cyclic_mixing_count: int
    suspect_total_illicit_volume_usd: float
    identified_terminal_vasps: List[Dict[str, Any]]
