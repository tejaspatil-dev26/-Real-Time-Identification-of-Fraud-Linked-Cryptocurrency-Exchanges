import torch
import torch.nn as nn
import torch.nn.functional as F

class GraphSAGELayer(nn.Module):
    """
    Standard GraphSAGE mean aggregator layer with LeakyReLU non-linearity.
    """
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.linear = nn.Linear(in_features * 2, out_features)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # Neighborhood mean aggregation: D^{-1} A X
        deg = torch.sum(adj, dim=-1, keepdim=True).clamp(min=1.0)
        neigh_mean = torch.matmul(adj, x) / deg
        concat = torch.cat([x, neigh_mean], dim=-1)
        out = self.linear(concat)
        return F.leaky_relu(out, negative_slope=0.2)

class GraphSAGE(nn.Module):
    """
    Inductive 3-Layer GraphSAGE Network specified in Section 6.3 of Technical Spec:
    - Input Features: 64
    - Hidden Channels: 128
    - Number of Layers: 3
    - Activation: LeakyReLU
    - Output Embedding: 32-dimensional latent vector per node
    """
    def __init__(
        self,
        in_channels: int = 64,
        hidden_channels: int = 128,
        out_channels: int = 32,
        num_layers: int = 3
    ):
        super().__init__()
        self.layers = nn.ModuleList()
        # Layer 1: 64 -> 128
        self.layers.append(GraphSAGELayer(in_channels, hidden_channels))
        # Layer 2: 128 -> 128
        self.layers.append(GraphSAGELayer(hidden_channels, hidden_channels))
        # Layer 3: 128 -> 32
        self.layers.append(GraphSAGELayer(hidden_channels, out_channels))

        self.classifier = nn.Linear(out_channels, 4) # 4 Entity typologies

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        h = x
        for layer in self.layers:
            h = layer(h, adj)
        return h

    def predict_entity_classes(self, embeddings: torch.Tensor) -> torch.Tensor:
        logits = self.classifier(embeddings)
        return F.softmax(logits, dim=-1)

def load_pretrained_graphsage(weights_path: str = None) -> GraphSAGE:
    from pathlib import Path
    model = GraphSAGE(in_channels=64, hidden_channels=128, out_channels=32, num_layers=3)
    if weights_path is None:
        weights_path = Path(__file__).resolve().parent.parent / "weights" / "graphsage_v1.pth"
    else:
        weights_path = Path(weights_path)
    if weights_path.is_file():
        try:
            ckpt = torch.load(str(weights_path), map_location="cpu")
            if "model_state_dict" in ckpt:
                # Filter matching keys
                model_dict = model.state_dict()
                pretrained = {k: v for k, v in ckpt["model_state_dict"].items() if k in model_dict and v.shape == model_dict[k].shape}
                model_dict.update(pretrained)
                model.load_state_dict(model_dict)
        except Exception:
            pass
    model.eval()
    return model

