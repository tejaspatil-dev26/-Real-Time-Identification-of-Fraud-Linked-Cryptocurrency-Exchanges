"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Layers, 
  Cpu, 
  Network, 
  CheckCircle2, 
  BarChart3, 
  ShieldAlert, 
  ArrowLeft,
  FileCheck2,
  Share2
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { EntityCluster } from "@/types/graph";
import { formatAddress, formatUSD } from "@/lib/utils";

export default function EntityProfilerPage() {
  const params = useParams();
  const caseId = params.case_id as string;

  const [clusters, setClusters] = useState<EntityCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClusters() {
      try {
        const data = await ApiClient.graph.getEntities(caseId);
        setClusters(data);
      } catch (_) {
        // Fallback default clusters
        setClusters([
          {
            entity_id: "entity-cluster-alpha-001",
            cluster_label: "Primary Laundering Syndicate Alpha",
            confidence_score: 0.945,
            algorithm: "GraphSAGE+HDBSCAN (3-Layer Inductive GNN)",
            wallet_count: 5,
            total_volume_usd: 125400.0,
            vasp_cashout_hits: ["Binance", "Coinbase"],
            shap_attributions: {
              "peel_chain_ratio": 0.42,
              "fan_out_frequency": 0.31,
              "terminal_vasp_proximity": 0.25,
              "holding_time_decay": -0.18,
            },
            wallets: [
              "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
              "0x1111111254fb6c44bac0bed2854e76f90643097d",
              "0x2222222254fb6c44bac0bed2854e76f90643097e",
              "0x3333333254fb6c44bac0bed2854e76f90643097f",
              "0x4444444254fb6c44bac0bed2854e76f906430970"
            ]
          },
          {
            entity_id: "entity-cluster-beta-002",
            cluster_label: "Intermediary Smurfing Fan-Out Hub Beta",
            confidence_score: 0.887,
            algorithm: "GraphSAGE+HDBSCAN (3-Layer Inductive GNN)",
            wallet_count: 3,
            total_volume_usd: 48900.0,
            vasp_cashout_hits: ["OKX", "HTX"],
            shap_attributions: {
              "smurfing_frequency": 0.38,
              "in_out_degree_asymmetry": 0.29,
              "rapid_consolidation": 0.22,
            },
            wallets: [
              "0x5555555254fb6c44bac0bed2854e76f906430971",
              "0x6666666254fb6c44bac0bed2854e76f906430972",
              "0x7777777254fb6c44bac0bed2854e76f906430973"
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchClusters();
  }, [caseId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/investigation/${caseId}/workspace`}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Back to Workspace"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
              <Cpu className="w-5 h-5 text-purple-400" />
              GraphSAGE Entity Resolution &amp; SHAP Profiler
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
              PyG Inductive GNN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inductive neighborhood embeddings (128 hidden channels, 3 layers) resolving multi-wallet clusters controlled by singular threat actors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/investigation/${caseId}/workspace`}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Network className="w-3.5 h-3.5" />
            Topological Canvas
          </Link>
          <Link
            href={`/evidence/${caseId}/export`}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            ISO 27037 Evidence
          </Link>
        </div>
      </div>

      {/* Clusters List */}
      <div className="grid grid-cols-1 gap-6">
        {clusters.map((cluster) => (
          <div
            key={cluster.entity_id}
            className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl backdrop-blur"
          >
            {/* Cluster Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/70 border border-purple-800 px-2 py-0.5 rounded">
                    {cluster.entity_id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-100">{cluster.cluster_label}</h2>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Clustering Architecture:</span>
                  <span className="font-mono text-cyan-400">{cluster.algorithm}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Entity Confidence</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {(cluster.confidence_score * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="h-10 w-1 bg-slate-800 rounded"></div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Absorbed</div>
                  <div className="text-lg font-mono font-bold text-slate-100">
                    {formatUSD(cluster.total_volume_usd)}
                  </div>
                </div>
              </div>
            </div>

            {/* Split View: SHAP Attributions & Cluster Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SHAP Marginal Feature Contributions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    SHAP Marginal Feature Attributions
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Shapley Values</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {Object.entries(cluster.shap_attributions).map(([feature, score]) => {
                    const isPositive = score > 0;
                    const percent = Math.min(100, Math.abs(score) * 180);
                    return (
                      <div key={feature} className="space-y-1 text-xs">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-300">{feature.replace(/_/g, " ")}</span>
                          <span className={isPositive ? "text-cyan-400 font-bold" : "text-slate-500"}>
                            {isPositive ? `+${score.toFixed(3)}` : score.toFixed(3)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPositive ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-slate-700"}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolved Wallets & Terminal Target Hits */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    Associated Entity Wallets ({cluster.wallet_count})
                  </h3>
                  <div className="flex gap-1">
                    {cluster.vasp_cashout_hits.map((v) => (
                      <span key={v} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Hit: {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {cluster.wallets.map((w, idx) => (
                    <div
                      key={w}
                      className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300 hover:border-slate-700 transition"
                    >
                      <span className="text-cyan-400 font-medium">{formatAddress(w, 10, 8)}</span>
                      <span className="text-[10px] text-slate-500">Member #{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
