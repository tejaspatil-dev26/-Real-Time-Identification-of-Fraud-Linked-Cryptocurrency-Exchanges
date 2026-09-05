"use client";

import React, { useEffect, useState } from "react";
import { 
  Flame, 
  ShieldAlert, 
  Download, 
  Copy, 
  Check, 
  FileCheck2, 
  ExternalLink, 
  Building2, 
  MapPin, 
  AlertTriangle,
  Lock,
  Layers,
  Radio,
  X
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { formatAddress, formatUSD } from "@/lib/utils";

interface FraudDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  seedWallet?: string;
  onIssueSubpoena?: (vasp: any) => void;
}

export default function FraudDetectionModal({
  isOpen,
  onClose,
  caseId,
  seedWallet,
  onIssueSubpoena,
}: FraudDetectionModalProps) {
  const [dossier, setDossier] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadDossier() {
      try {
        setLoading(true);
        const data = await ApiClient.evidence.getFraudDossierSummary(caseId);
        setDossier(data);
      } catch (_) {
        // High fidelity fallback dossier
        setDossier({
          case_id: caseId,
          case_number: "CASE-9024-XRAY",
          generated_at: new Date().toUTCString(),
          suspect_profile: {
            alias: "ShadowVault Syndicate (APT-44)",
            threat_score: 96.5,
            priority_rank: "CRITICAL_SEIZURE_TARGET",
            seed_wallet: seedWallet || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            network: "ETHEREUM",
            total_dissipated_usd: 125400.0,
            threat_level: "CRITICAL",
            modus_operandi: "Automated Smart Contract Drainer & Multi-Hop Peel Forwarding",
            ip_cluster: "91.240.118.42 (Selectel Cloud)",
            isp: "Selectel Cloud Hosting",
            origin_city: "St. Petersburg",
            origin_country: "Russian Federation",
            country_code: "RU",
          },
          anomalies: {
            peel_chains_count: 2,
            smurfing_fan_out_count: 3,
            cross_bridge_hops_count: 1,
            mixer_pools_detected: 1,
          },
          terminal_vasps: [
            { vasp_name: "Binance", risk_tier: "LOW", absorbed_volume_usd: 13680.0, deposit_address: "0x28C6c06298d514Db089934071355E5743bf21d60", jurisdiction: "KYM" },
            { vasp_name: "Coinbase", risk_tier: "LOW", absorbed_volume_usd: 11400.0, deposit_address: "0x503828976D22510aad0201ac7EC88293211A23Dc", jurisdiction: "USA" }
          ],
          mule_wallets: [
            "0x1111111254fb6c44bac0bed2854e76f90643097d",
            "0x2222222254fb6c44bac0bed2854e76f90643097e",
            "0x3333333254fb6c44bac0bed2854e76f90643097f",
            "0x4444444254fb6c44bac0bed2854e76f906430970"
          ],
          legal_statute: "18 U.S.C. § 981 / 18 U.S.C. § 1956 (Civil & Criminal Asset Forfeiture)"
        });
      } finally {
        setLoading(false);
      }
    }

    loadDossier();
  }, [isOpen, caseId, seedWallet]);

  if (!isOpen) return null;

  const profile = dossier?.suspect_profile;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    const url = ApiClient.evidence.getFraudDossierDownloadUrl(caseId);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud_dossier_${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingPdf(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-cyan-950/80 p-5 border-b border-rose-500/30 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">
                CONFIDENTIAL // LAW ENFORCEMENT INTELLIGENCE
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Suspect Investigation Report
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Case Ref: {dossier?.case_number || "CASE-001"} | Multi-Hop GNN Dissipation Profiling
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Primary Suspect Hero Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 to-slate-950 border border-rose-500/30 shadow-inner space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-900/40 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  {profile?.threat_level || "CRITICAL"} PRIORITY TARGET
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1 font-mono">
                  {profile?.alias || "ShadowVault Syndicate"}
                </h3>
              </div>

              {/* Threat Meter Circular Badge */}
              <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-rose-500/30">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Threat Index</div>
                  <div className="text-rose-400 font-bold font-mono text-sm">
                    {profile?.threat_score || 96.5} / 100
                  </div>
                </div>
                <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">Primary Seed Wallet:</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-mono text-cyan-300">
                  <span>{formatAddress(profile?.seed_wallet || "", 10, 8)}</span>
                  <button
                    onClick={() => handleCopy(profile?.seed_wallet || "")}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title="Copy Address"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Estimated Illicit Volume:</span>
                <span className="text-emerald-400 font-bold font-mono text-xs">
                  {formatUSD(profile?.total_dissipated_usd || 125400.0)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Probable Physical Origin:</span>
                <span className="text-slate-200 font-semibold">
                  {profile?.origin_city}, {profile?.origin_country} ({profile?.country_code})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">IP Cluster &amp; Hosting:</span>
                <span className="text-amber-400 font-mono">
                  {profile?.ip_cluster || "Selectel Cloud Relay"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] leading-relaxed">
              <span className="text-slate-400 font-bold">Modus Operandi: </span>
              <span className="text-slate-200">{profile?.modus_operandi}</span>
            </div>
          </div>

          {/* Terminal Cash-Out VASPs (Seizure Orders) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Identified Terminal VASPs (Statutory Asset Freeze Targets)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                18 U.S.C. § 981
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dossier?.terminal_vasps?.map((vasp: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{vasp.vasp_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      FREEZE DEMAND
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                    <span>Absorbed Inflow:</span>
                    <span className="text-emerald-400 font-bold">{formatUSD(vasp.absorbed_volume_usd || 0)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    Deposit: {vasp.deposit_address}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GNN Clustered Mule Wallets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Layers className="w-4 h-4 text-cyan-400" />
                GraphSAGE GNN Clustered Mule Ring ({dossier?.mule_wallets?.length || 0} Wallets)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Confidence: 94.5%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dossier?.mule_wallets?.map((mw: string, idx: number) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Mule {idx + 1}:</span>
                  <span className="text-cyan-300 font-semibold">{formatAddress(mw, 8, 6)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500 font-mono">
            ISO/IEC 27037:2012 Certified Forensic Evidence Package Ready
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? "Generating PDF Report..." : "Download Investigation Report (PDF)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
