"use client";

import { useEffect, useState } from "react";
import { Database, Search, Filter, Plus, ShieldCheck, AlertTriangle, Globe, Mail } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { VASPEntity } from "@/types/api";
import { getRiskColor } from "@/lib/utils";

export default function VaspRegistryPage() {
  const [vasps, setVasps] = useState<VASPEntity[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New VASP form state
  const [newVaspName, setNewVaspName] = useState("");
  const [newLegalName, setNewLegalName] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("USA");
  const [newRisk, setNewRisk] = useState("LOW");
  const [newEmail, setNewEmail] = useState("");
  const [newTravelRule, setNewTravelRule] = useState(true);

  const fetchVasps = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.vasp.list(search || undefined, riskFilter || undefined);
      setVasps(data);
    } catch (_) {
      // Default fallback VASPs
      setVasps([
        {
          id: "vasp-1",
          vasp_name: "Binance",
          legal_entity_name: "Binance Holdings Ltd",
          jurisdiction_code: "KYM",
          risk_level: "LOW",
          compliance_email: "compliance@binance.com",
          travel_rule_compliant: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "vasp-2",
          vasp_name: "Coinbase",
          legal_entity_name: "Coinbase Global Inc",
          jurisdiction_code: "USA",
          risk_level: "LOW",
          compliance_email: "lawenforcement@coinbase.com",
          travel_rule_compliant: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "vasp-3",
          vasp_name: "Kraken",
          legal_entity_name: "Payward Inc",
          jurisdiction_code: "USA",
          risk_level: "LOW",
          compliance_email: "compliance@kraken.com",
          travel_rule_compliant: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "vasp-4",
          vasp_name: "OKX",
          legal_entity_name: "Aux Cayes FinTech Co",
          jurisdiction_code: "SYC",
          risk_level: "LOW",
          compliance_email: "legal@okx.com",
          travel_rule_compliant: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "vasp-5",
          vasp_name: "HTX (Huobi)",
          legal_entity_name: "Huobi Global Ltd",
          jurisdiction_code: "SYC",
          risk_level: "MEDIUM",
          compliance_email: "compliance@htx.com",
          travel_rule_compliant: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "vasp-6",
          vasp_name: "Tornado Cash (Sanctioned)",
          legal_entity_name: "Decentralized Smart Contract Mixer",
          jurisdiction_code: "UNK",
          risk_level: "CRITICAL",
          compliance_email: "none@tornadocash.eth",
          travel_rule_compliant: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVasps();
  }, [search, riskFilter]);

  const handleAddVasp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.vasp.createOrUpdate({
        vasp_name: newVaspName,
        legal_entity_name: newLegalName,
        jurisdiction_code: newJurisdiction,
        risk_level: newRisk,
        compliance_email: newEmail,
        travel_rule_compliant: newTravelRule,
      });
      setShowAddModal(false);
      setNewVaspName("");
      setNewLegalName("");
      setNewEmail("");
      fetchVasps();
    } catch (err) {
      alert("Error adding VASP entity");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
            <Database className="w-6 h-6 text-emerald-400" />
            Virtual Asset Service Provider (VASP) Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            FATF Travel Rule intelligence, risk tiers, and legal law enforcement compliance contact index.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 self-start sm:self-auto font-mono"
        >
          <Plus className="w-4 h-4" />
          Add VASP Entity
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VASP name, legal entity, or jurisdiction..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* VASP Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">VASP Name</th>
                <th className="px-5 py-3.5">Legal Entity</th>
                <th className="px-5 py-3.5">Jurisdiction</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5">Travel Rule</th>
                <th className="px-5 py-3.5">Compliance Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vasps.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {v.vasp_name}
                  </td>
                  <td className="px-5 py-4 text-slate-300">{v.legal_entity_name || "—"}</td>
                  <td className="px-5 py-4 font-mono text-cyan-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {v.jurisdiction_code || "N/A"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(v.risk_level)}`}>
                      {v.risk_level}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {v.travel_rule_compliant ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Non-Compliant
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {v.compliance_email || "Not Available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Add New VASP Entity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <form onSubmit={handleAddVasp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">VASP Common Name</label>
                <input
                  type="text"
                  required
                  value={newVaspName}
                  onChange={(e) => setNewVaspName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  placeholder="e.g. Bitfinex"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Legal Corporate Entity</label>
                <input
                  type="text"
                  value={newLegalName}
                  onChange={(e) => setNewLegalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  placeholder="e.g. iFinex Inc."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Jurisdiction (Alpha-3)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 uppercase font-mono"
                    placeholder="VGB"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Risk Assessment</label>
                  <select
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Law Enforcement Compliance Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  placeholder="lawenforcement@exchange.com"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
