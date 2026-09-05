"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, ArrowUpDown, ExternalLink, Flame, Layers } from "lucide-react";
import { formatAddress, formatUSD } from "@/lib/utils";

export interface ThreatRankingItem {
  address: string;
  label?: string;
  type: string;
  network: string;
  threat_score: number;
  priority_rank: string;
  balance_usd: number;
  hop_depth: number;
  has_mixer: boolean;
  is_peel_node: boolean;
  is_seed: boolean;
  factors?: {
    volume_weight: number;
    gnn_anomaly_weight: number;
    mixer_weight: number;
    peel_weight: number;
  };
}

interface ThreatMatrixTableProps {
  items: ThreatRankingItem[];
  onSelectAddress?: (address: string) => void;
}

export default function ThreatMatrixTable({ items, onSelectAddress }: ThreatMatrixTableProps) {
  const [sortField, setSortField] = useState<"threat_score" | "balance_usd" | "hop_depth">("threat_score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterTier, setFilterTier] = useState<string>("ALL");

  const handleSort = (field: "threat_score" | "balance_usd" | "hop_depth") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filtered = items.filter((item) => {
    if (filterTier === "ALL") return true;
    return item.priority_rank === filterTier;
  });

  const sorted = [...filtered].sort((a, b) => {
    const factor = sortAsc ? 1 : -1;
    return (a[sortField] - b[sortField]) * factor;
  });

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case "CRITICAL_SEIZURE_TARGET":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "HIGH_MONITORING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "MEDIUM_ANOMALY":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-slate-200">Threat Matrix &amp; Seizure Ranking</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
            {items.length} Wallets
          </span>
        </div>

        <div className="flex items-center gap-1">
          {["ALL", "CRITICAL_SEIZURE_TARGET", "HIGH_MONITORING", "MEDIUM_ANOMALY"].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition ${
                filterTier === tier
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {tier === "ALL" ? "All Tiers" : tier.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-mono bg-slate-900/60">
              <th className="p-3">Wallet / Entity</th>
              <th 
                className="p-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("threat_score")}
              >
                <div className="flex items-center gap-1">
                  <span>Threat Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Priority Classification</th>
              <th 
                className="p-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("balance_usd")}
              >
                <div className="flex items-center gap-1">
                  <span>Balance (USD)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("hop_depth")}
              >
                <div className="flex items-center gap-1">
                  <span>Depth</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Typology Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {sorted.map((row) => (
              <tr 
                key={row.address}
                onClick={() => onSelectAddress && onSelectAddress(row.address)}
                className="hover:bg-slate-900/50 cursor-pointer transition"
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-semibold">{formatAddress(row.address, 6, 4)}</span>
                    {row.is_seed && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-sans">
                        SEED
                      </span>
                    )}
                  </div>
                  {row.label && (
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{row.label}</div>
                  )}
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${row.threat_score >= 80 ? "text-rose-400" : row.threat_score >= 60 ? "text-amber-400" : "text-cyan-400"}`}>
                      {row.threat_score}
                    </span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${row.threat_score >= 80 ? "bg-rose-500" : row.threat_score >= 60 ? "bg-amber-500" : "bg-cyan-500"}`}
                        style={{ width: `${Math.min(100, row.threat_score)}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-sans font-semibold ${getRankBadge(row.priority_rank)}`}>
                    {row.priority_rank.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="p-3 text-slate-300 font-semibold">
                  {formatUSD(row.balance_usd)}
                </td>

                <td className="p-3 text-slate-400">
                  Hop {row.hop_depth}
                </td>

                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {row.is_peel_node && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] border border-amber-500/20">
                        Peel Chain
                      </span>
                    )}
                    {row.has_mixer && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] border border-purple-500/20">
                        Mixer Interaction
                      </span>
                    )}
                    {row.type === "bridge" && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[9px] border border-teal-500/20">
                        Cross-Bridge
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
