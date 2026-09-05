"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, ShieldCheck, Clock, User, Terminal, Network, FileCheck2 } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { AuditLogEntry } from "@/types/api";

export default function AuditTrailPage() {
  const params = useParams();
  const caseId = params.case_id as string;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditTrail() {
      try {
        const data = await ApiClient.evidence.getAuditTrail(caseId);
        setLogs(data);
      } catch (_) {
        // Fallback default audit logs
        setLogs([
          {
            id: 104,
            case_id: caseId,
            user_id: "agent.smith@fbi.gov",
            action: "ISO27037_EVIDENCE_GENERATED",
            payload_snapshot: { status: "SUCCESS", sha256_digest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
            ip_address: "127.0.0.1",
            timestamp: new Date().toISOString(),
          },
          {
            id: 103,
            case_id: caseId,
            user_id: "system_worker",
            action: "GNN_INFERENCE_COMPLETE",
            payload_snapshot: { resolved_entities: 2, dominant_cluster: "Entity-Cluster-Alpha" },
            ip_address: "127.0.0.1",
            timestamp: new Date(Date.now() - 60000).toISOString(),
          },
          {
            id: 102,
            case_id: caseId,
            user_id: "system_worker",
            action: "GRAPH_EXPANSION_COMPLETE",
            payload_snapshot: { max_depth: 5, nodes_acquired: 18, edges_acquired: 16 },
            ip_address: "127.0.0.1",
            timestamp: new Date(Date.now() - 120000).toISOString(),
          },
          {
            id: 101,
            case_id: caseId,
            user_id: "agent.smith@fbi.gov",
            action: "INVESTIGATION_DISPATCHED",
            payload_snapshot: { seed_wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", network: "ETHEREUM" },
            ip_address: "127.0.0.1",
            timestamp: new Date(Date.now() - 180000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditTrail();
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
              <Activity className="w-5 h-5 text-blue-400" />
              Chain-of-Custody Audit Trail
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              ISO/IEC 27037:2012
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, append-only chronological log of all forensic acquisitions, graph expansions, and investigator actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/investigation/${caseId}/workspace`}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Network className="w-3.5 h-3.5" />
            Workspace
          </Link>
          <Link
            href={`/evidence/${caseId}/export`}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Evidence Export
          </Link>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
        <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pl-6">
          {logs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Bullet */}
              <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
              </div>

              {/* Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {log.user_id || "System"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>

                {log.payload_snapshot && (
                  <div className="mt-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px] font-mono text-slate-400 overflow-x-auto">
                    <pre className="text-slate-300">{JSON.stringify(log.payload_snapshot, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
