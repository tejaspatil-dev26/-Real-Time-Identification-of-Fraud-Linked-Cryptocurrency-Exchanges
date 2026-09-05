import numpy as np
import torch
from typing import Any, Dict, List, Tuple

class SubgraphFeatureBuilder:
    """
    Transforms topological subgraphs into 64-dimensional feature tensors
    and normalized adjacency matrices for GraphSAGE inference.
    """
    FEATURE_DIM = 64

    @classmethod
    def build_tensors(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Tuple[torch.Tensor, torch.Tensor, List[str]]:
        num_nodes = len(nodes)
        node_id_map = {node["data"]["id"]: idx for idx, node in enumerate(nodes)}
        address_list = [node["data"]["id"] for node in nodes]

        # 1. Initialize 64-dimensional feature matrix
        x = np.zeros((num_nodes, cls.FEATURE_DIM), dtype=np.float32)

        # Calculate degrees
        in_degrees = np.zeros(num_nodes)
        out_degrees = np.zeros(num_nodes)
        total_volumes = np.zeros(num_nodes)

        for edge in edges:
            src_id = edge["data"]["source"]
            tgt_id = edge["data"]["target"]
            amt = float(edge["data"].get("amount", 1.0))
            if src_id in node_id_map and tgt_id in node_id_map:
                u = node_id_map[src_id]
                v = node_id_map[tgt_id]
                out_degrees[u] += 1
                in_degrees[v] += 1
                total_volumes[u] += amt
                total_volumes[v] += amt

        for idx, node in enumerate(nodes):
            data = node["data"]
            balance = float(data.get("balance", 0.0))
            risk_score = float(data.get("risk_score", 0.5))
            hop = float(data.get("hop_depth", 1))
            is_seed = 1.0 if data.get("is_seed") else 0.0
            is_vasp = 1.0 if data.get("type") == "vasp" else 0.0
            peel_flag = 1.0 if data.get("peel_chain_detected") else 0.0
            fan_out_flag = 1.0 if data.get("fan_out_detected") else 0.0

            # Compute specific features
            vol = total_volumes[idx]
            in_deg = in_degrees[idx]
            out_deg = out_degrees[idx]
            deg_ratio = (out_deg + 1e-4) / (in_deg + 1e-4)

            # Assign first key behavioral features
            x[idx, 0] = np.log1p(max(0.0, balance)) # 0: Log-scaled balance
            x[idx, 1] = np.log1p(vol)              # 1: Log-scaled total volume
            x[idx, 2] = in_deg                     # 2: In-degree
            x[idx, 3] = out_deg                    # 3: Out-degree
            x[idx, 4] = deg_ratio                  # 4: Degree ratio
            x[idx, 5] = risk_score                 # 5: Pre-computed heuristic risk score
            x[idx, 6] = hop                        # 6: Hop depth from seed
            x[idx, 7] = is_seed                    # 7: Is complaint seed
            x[idx, 8] = is_vasp                    # 8: Is terminal VASP
            x[idx, 9] = peel_flag                  # 9: Peel chain indicator
            x[idx, 10] = fan_out_flag              # 10: Smurfing fan-out indicator
            x[idx, 11] = float(np.var([vol, balance, in_deg])) # 11: Local variance

            # Pad remaining dimensions with normalized positional/frequency encodings
            for d in range(12, cls.FEATURE_DIM):
                x[idx, d] = np.sin((idx + 1) * (d + 1) * 0.1) * 0.1

        # 2. Build Adjacency Matrix
        adj = np.zeros((num_nodes, num_nodes), dtype=np.float32)
        # Self-loops
        np.fill_diagonal(adj, 1.0)

        for edge in edges:
            src_id = edge["data"]["source"]
            tgt_id = edge["data"]["target"]
            if src_id in node_id_map and tgt_id in node_id_map:
                u = node_id_map[src_id]
                v = node_id_map[tgt_id]
                adj[u, v] = 1.0
                adj[v, u] = 0.5 # Bi-directional signal propagation

        return torch.tensor(x, dtype=torch.float32), torch.tensor(adj, dtype=torch.float32), address_list
