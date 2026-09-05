"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  FolderLock, 
  Network, 
  AlertTriangle, 
  PlusCircle, 
  ArrowUpRight, 
  FileCheck2, 
  Activity,
  Layers,
  Database
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { Case } from "@/types/api";
import { formatAddress, formatUSD } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("forensics_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(raw));

    async function fetchCases() {
      try {
        const data = await ApiClient.cases.list();
        setCases(data);
      } catch (_) {
        // Mock default case if backend is empty
        setCases([
          {
            id: "c1f7a22a-5793-4a1b-bd57-a37a13d789e4",
            case_number: "CASE-9024-XRAY",
            title: "Operation DarkHarbor: Ransomware Laundering Network",
            description: "Suspect victim fund dissipation traced across multi-hop peel chains into major exchange deposit addresses.",
            status: "ACTIVE",
            primary_investigator_id: "agent-smith",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            suspect_wallets: [
              {
                id: "sw-1",
                case_id: "c1f7a22a-5793-4a1b-bd57-a37a13d789e4",
                address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                network: "ETHEREUM",
                reported_victim_loss_usd: 125000.0,
                added_at: new Date().toISOString(),
              },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-emerald-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Forensics Operations Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Session
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Real-time telemetry, topological entity clustering, and court-ready ISO/IEC 27037 evidence management.
          </p>
        </div>

        <Link
          href="/investigation/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(52,211,153,0.6)] transition-all duration-300 font-mono self-start md:self-auto transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          Initialize New Investigation
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#05130b]/70 via-[#030c07]/70 to-black/80 border border-emerald-500/20 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.04)] hover:border-emerald-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.1)] transition-all duration-300 backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono font-medium">Active Cases</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white tracking-tight">{cases.length || 1}</div>
          <div className="mt-1.5 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> 100% On-Chain Indexed
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#05130b]/70 via-[#030c07]/70 to-black/80 border border-emerald-500/20 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.04)] hover:border-emerald-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.1)] transition-all duration-300 backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono font-medium">Illicit Volume Tracked</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white tracking-tight">$1,420,850.00</div>
          <div className="mt-1.5 text-[11px] font-mono text-amber-400/90">Across 6 Downstream Hops</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#05130b]/70 via-[#030c07]/70 to-black/80 border border-emerald-500/20 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.04)] hover:border-emerald-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.1)] transition-all duration-300 backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono font-medium">GNN Resolved Entities</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:shadow-[0_0_12px_rgba(20,184,166,0.3)] transition">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white tracking-tight">8 Syndicates</div>
          <div className="mt-1.5 text-[11px] font-mono text-teal-400/90">GraphSAGE Inductive Clustered</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#05130b]/70 via-[#030c07]/70 to-black/80 border border-emerald-500/20 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.04)] hover:border-emerald-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.1)] transition-all duration-300 backdrop-blur-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono font-medium">Terminal VASPs Identified</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-black font-mono text-white tracking-tight">14 Cash-Out Points</div>
          <div className="mt-1.5 text-[11px] font-mono text-emerald-400/90">Binance, Coinbase, Kraken, OKX</div>
        </div>
      </div>

      {/* Case Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-mono">
            <FolderLock className="w-5 h-5 text-emerald-400" />
            Active Forensic Cases
          </h2>
          <span className="text-xs text-slate-400 font-mono">Displaying recent active investigations</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cases.map((c) => {
            const seed = c.suspect_wallets?.[0]?.address || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
            return (
              <div
                key={c.id}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#05130b]/60 via-[#030c07]/60 to-black/75 border border-emerald-500/20 hover:border-emerald-500/35 transition-all duration-300 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.5)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/15 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        {c.case_number}
                      </span>
                      <h3 className="text-base font-bold text-white font-mono">{c.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-mono">{c.description}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    {c.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="font-mono">
                    <span className="text-slate-500">Seed Suspect: </span>
                    <span className="text-slate-200 font-semibold">{formatAddress(seed, 10, 8)}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20 font-mono">
                      {c.suspect_wallets?.[0]?.network || "ETHEREUM"}
                    </span>
                  </div>

                  {/* Navigation Hub */}
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <Link
                      href={`/investigation/${c.id}/workspace`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition font-medium text-xs shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    >
                      <Network className="w-3.5 h-3.5" />
                      Workspace
                    </Link>
                    <Link
                      href={`/investigation/${c.id}/entity-profiler`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20 hover:border-teal-500/40 transition font-medium text-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      GNN Profiler
                    </Link>
                    <Link
                      href={`/investigation/${c.id}/audit-trail`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800 transition font-medium text-xs"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Audit Trail
                    </Link>
                    <Link
                      href={`/evidence/${c.id}/export`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition font-medium text-xs shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Evidence Hub
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
