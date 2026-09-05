declare module "cytoscape-dagre";
declare module "cytoscape-fcose";

export interface GraphNodeData {

  id: string;
  label: string;
  type: "wallet" | "transaction" | "vasp" | "entity";
  address?: string;
  network?: string;
  balance?: number;
  risk_score?: number;
  is_contract?: boolean;
  is_seed?: boolean;
  cluster_id?: string;
  vasp_name?: string;
  vasp_risk?: string;
  hop_depth?: number;
  peel_chain_detected?: boolean;
  fan_out_detected?: boolean;
  fan_in_detected?: boolean;
}

export interface GraphNode {
  data: GraphNodeData;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  tx_hash?: string;
  amount: number;
  amount_usd?: number;
  timestamp?: string;
  token: string;
  is_peel_chain?: boolean;
  is_split?: boolean;
}

export interface GraphEdge {
  data: GraphEdgeData;
}

export interface CytoscapeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];

  stats?: {
    total_nodes: number;
    total_edges: number;
    peel_chains_count: number;
    terminal_vasps: number;
    illicit_volume_absorbed_usd: number;
  };
  anomalies?: {
    peel_chains_count: number;
    smurfing_fan_out_count: number;
    fan_in_consolidation_count: number;
    cyclic_mixing_count: number;
    suspect_total_illicit_volume_usd: number;
    identified_terminal_vasps: Array<{
      vasp_name: string;
      risk_tier: string;
      deposit_address: string;
      absorbed_transactions: number;
      absorbed_volume_usd: number;
    }>;
  };
}

export type GraphPayload = CytoscapeGraphData;

export interface EntityCluster {

  entity_id: string;
  cluster_label: string;
  confidence_score: number;
  algorithm: string;
  wallet_count: number;
  total_volume_usd: number;
  vasp_cashout_hits: string[];
  shap_attributions: Record<string, number>;
  wallets: string[];
}
