import os
from pathlib import Path
import torch
import torch.nn as nn

weights_dir = Path(__file__).resolve().parent
weights_dir.mkdir(parents=True, exist_ok=True)
checkpoint_path = weights_dir / "graphsage_v1.pth"

# 3-Layer GraphSAGE model definition matching worker_app/ml/models/graphsage.py
class GraphSAGE(nn.Module):
    def __init__(self, in_channels: int = 64, hidden_channels: int = 128, out_channels: int = 32, num_layers: int = 3):
        super().__init__()
        self.num_layers = num_layers
        self.convs = nn.ModuleList()
        self.convs.append(nn.Linear(in_channels * 2, hidden_channels))
        for _ in range(num_layers - 2):
            self.convs.append(nn.Linear(hidden_channels * 2, hidden_channels))
        self.convs.append(nn.Linear(hidden_channels * 2, out_channels))
        self.act = nn.LeakyReLU(negative_slope=0.2)
        self.norm = nn.BatchNorm1d(hidden_channels)

model = GraphSAGE(in_channels=64, hidden_channels=128, out_channels=32, num_layers=3)
torch.manual_seed(42)

checkpoint = {
    "model_state_dict": model.state_dict(),
    "in_channels": 64,
    "hidden_channels": 128,
    "out_channels": 32,
    "num_layers": 3,
    "version": "1.0.0",
    "architecture": "GraphSAGE-Inductive-LEU",
    "feature_dimensions": 64,
}

torch.save(checkpoint, str(checkpoint_path))
print(f"GraphSAGE model checkpoint saved to: {checkpoint_path}")
