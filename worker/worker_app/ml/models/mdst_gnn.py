import torch
import torch.nn as nn
import torch.nn.functional as F

class MDST_GNN(nn.Module):
    """
    Multi-Dimensional Spatio-Temporal Graph Anomaly Detection Model.
    Analyzes temporal frequency bursts and peel-chain interval sequences.
    """
    def __init__(self, node_dim: int = 64, time_dim: int = 16, hidden_dim: int = 64):
        super().__init__()
        self.spatial_linear = nn.Linear(node_dim, hidden_dim)
        self.temporal_gru = nn.GRU(time_dim, hidden_dim, batch_first=True)
        self.fusion = nn.Linear(hidden_dim * 2, hidden_dim)
        self.anomaly_head = nn.Linear(hidden_dim, 1)

    def forward(self, x: torch.Tensor, time_series: torch.Tensor) -> torch.Tensor:
        h_spatial = F.relu(self.spatial_linear(x))
        out_temp, _ = self.temporal_gru(time_series)
        h_temporal = out_temp[:, -1, :] # Last hidden state

        combined = torch.cat([h_spatial, h_temporal], dim=-1)
        fused = F.leaky_relu(self.fusion(combined))
        anomaly_scores = torch.sigmoid(self.anomaly_head(fused))
        return anomaly_scores
