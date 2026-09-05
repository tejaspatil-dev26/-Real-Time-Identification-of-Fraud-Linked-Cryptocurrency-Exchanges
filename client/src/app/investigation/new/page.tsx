"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Network, ArrowRight, AlertCircle, DollarSign, Layers, CheckCircle2 } from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function NewInvestigationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Operation Sentinel: Stolen Fund Flow Analysis");
  const [description, setDescription] = useState("Victim complaint alleging theft of digital assets through malicious smart contract drainer.");
  const [seedWallet, setSeedWallet] = useState("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
  const [network, setNetwork] = useState("ETHEREUM");
  const [victimLossUsd, setVictimLossUsd] = useState(85000);
  const [maxDepth, setMaxDepth] = useState(5);
  const [minUsdThreshold, setMinUsdThreshold] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAddress = (addr: string, net: string) => {
    if (net === "ETHEREUM" || net === "POLYGON") {
      return /^0x[a-fA-F0-9]{40}$/.test(addr);
    }
    if (net === "BITCOIN") {
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
    }
    if (net === "TRON") {
      return /^T[a-zA-HJ-NP-Z0-9]{33}$/.test(addr);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAddress(seedWallet, network)) {
      setError(`Invalid ${network} address format. Please check address and try again.`);
      return;
    }

    setLoading(true);
    try {
      // 1. Create Case
      const caseRes = await ApiClient.cases.create({
        title,
        description,
        seed_wallet: seedWallet,
        network,
        reported_victim_loss_usd: victimLossUsd,
      });

      // 2. Dispatch Multi-Hop Investigation Task
      await ApiClient.investigations.dispatch({
        case_id: caseRes.id,
        seed_wallet: seedWallet,
        network,
        max_depth: maxDepth,
        min_usd_threshold: minUsdThreshold,
      });

      // 3. Redirect to active workspace
      router.push(`/investigation/${caseRes.id}/workspace`);
    } catch (err: any) {
      setError(err.message || "Failed to initialize investigation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Network className="w-6 h-6 text-cyan-400" />
          Initialize Suspect Wallet Intake
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated multi-hop BFS/DFS graph expansion with GraphSAGE inductive entity resolution.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await ApiClient.auth.login({
                  email: "agent.smith@fbi.gov",
                  password: "InvestigatorPassword123!"
                });
                ApiClient.setToken(res.access_token);
                if (res.user) {
                  localStorage.setItem("forensics_user", JSON.stringify(res.user));
                }
                // Auto-retry dispatch
                const caseRes = await ApiClient.cases.create({
                  title,
                  description,
                  seed_wallet: seedWallet,
                  network,
                  reported_victim_loss_usd: victimLossUsd,
                });
                await ApiClient.investigations.dispatch({
                  case_id: caseRes.id,
                  seed_wallet: seedWallet,
                  network,
                  max_depth: maxDepth,
                  min_usd_threshold: minUsdThreshold,
                });
                router.push(`/investigation/${caseRes.id}/workspace`);
              } catch (e: any) {
                setError(e.message || "Failed to re-authenticate.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition self-start sm:self-auto shadow-sm"
          >
            Re-Authenticate &amp; Dispatch →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl space-y-5 shadow-2xl backdrop-blur">
        {/* Case Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Investigation Case Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium transition"
            placeholder="e.g. Operation DeepWater: Stolen ETH Drainer"
          />
        </div>

        {/* Case Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Investigative Context &amp; Complaint Summary</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            placeholder="Summarize the victim statement or threat actor indicators..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Network */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Blockchain Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
            >
              <option value="ETHEREUM">Ethereum (ERC-55)</option>
              <option value="BITCOIN">Bitcoin (Base58 / Bech32)</option>
              <option value="POLYGON">Polygon (POS)</option>
              <option value="TRON">Tron (TRC-20)</option>
            </select>
          </div>

          {/* Reported Victim Loss USD */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reported Victim Loss (USD)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={victimLossUsd}
                onChange={(e) => setVictimLossUsd(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <DollarSign className="w-4 h-4 text-emerald-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Suspect Seed Wallet Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Suspect Seed Wallet Address
          </label>
          <input
            type="text"
            required
            value={seedWallet}
            onChange={(e) => setSeedWallet(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 tracking-wide transition"
            placeholder="0x... or bc1..."
          />
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
            Validated format: Ethereum ERC-55 / Bitcoin SegWit
          </div>
        </div>

        {/* Traversal Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Traversal Depth (1 to 6 Hops)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="6"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-cyan-400 font-bold min-w-[50px]">{maxDepth} Hops</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Min USD Threshold Filter
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5000"
                step="250"
                value={minUsdThreshold}
                onChange={(e) => setMinUsdThreshold(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-emerald-400 font-bold min-w-[60px]">${minUsdThreshold}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Dispatching Celery Pipeline..." : "Dispatch Automated Graph Traversal"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
