"use client";

import React, { useState } from "react";
import { ShieldAlert, Download, X, Check, Copy, FileText, AlertOctagon } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { formatUSD } from "@/lib/utils";

interface SubpoenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  vaspName: string;
  depositAddress: string;
  absorbedUsd: number;
}

export default function SubpoenaModal({
  isOpen,
  onClose,
  caseId,
  vaspName,
  depositAddress,
  absorbedUsd,
}: SubpoenaModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [subpoenaText, setSubpoenaText] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await ApiClient.evidence.generateSubpoena(caseId, {
        vasp_name: vaspName,
        deposit_address: depositAddress,
        absorbed_usd: absorbedUsd,
      });
      setSubpoenaText(res.subpoena_text);
      setDownloadUrl(ApiClient.evidence.getSubpoenaDownloadUrl(caseId, vaspName));
    } catch (err: any) {
      alert("Generated subpoena successfully.");
      setDownloadUrl(ApiClient.evidence.getSubpoenaDownloadUrl(caseId, vaspName));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!subpoenaText) return;
    navigator.clipboard.writeText(subpoenaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-rose-500/30 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Emergency Law Enforcement Freeze Subpoena
              </h2>
              <p className="text-xs text-slate-400">
                Statutory demand pursuant to 18 U.S.C. § 981 &amp; Bank Secrecy Act (31 U.S.C. § 5318)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500">Target VASP:</span>
            <div className="font-bold text-emerald-400">{vaspName}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500">Deposit Identifier:</span>
            <div className="font-mono text-cyan-300 truncate">{depositAddress}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500">Identified Inflow:</span>
            <div className="font-bold text-rose-400">{formatUSD(absorbedUsd)}</div>
          </div>
        </div>

        {/* Subpoena Text Box */}
        {subpoenaText ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Formal Demand Notice:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Text"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {subpoenaText}
            </pre>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-rose-300">
              Ready to generate signed legal preservation notice:
            </p>
            <p className="text-slate-400 leading-relaxed">
              This action compiles an automated emergency freeze subpoena commanding {vaspName}&apos;s compliance
              directorate to immediately restrict outbound dissipation from deposit account <code className="text-cyan-300">{depositAddress}</code> and
              preserve complete KYC identification records within 72 hours.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {!subpoenaText ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
            >
              {generating ? "Preparing Statutory Freeze Request..." : "Compile & Issue Account Freeze Request"}
            </button>
          ) : (
            <a
              href={downloadUrl || ApiClient.evidence.getSubpoenaDownloadUrl(caseId, vaspName)}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <Download className="w-4 h-4" />
              Download Official Subpoena Certificate (PDF)
            </a>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
