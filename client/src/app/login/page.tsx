"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("agent.smith@fbi.gov");
  const [password, setPassword] = useState("InvestigatorPassword123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await ApiClient.auth.login({ email, password });
      ApiClient.setToken(res.access_token);
      localStorage.setItem("forensics_user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setRolePreset = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 mb-3 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Investigator Gateway</h2>
          <p className="text-xs text-slate-400 mt-1">Cryptographic RS256 RBAC Authentication</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Official Agency Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                placeholder="agent@agency.gov"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Passphrase</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Verifying Signature..." : "Sign In to Evidence Console"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Switch Role Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Role Demo Sign-In
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRolePreset("agent.smith@fbi.gov", "InvestigatorPassword123!")}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center transition"
            >
              <div className="text-[10px] font-bold text-cyan-400">INVESTIGATOR</div>
              <div className="text-[9px] text-slate-400">FBI Unit</div>
            </button>

            <button
              type="button"
              onClick={() => setRolePreset("analyst.chen@finsec.org", "AnalystPassword123!")}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center transition"
            >
              <div className="text-[10px] font-bold text-blue-400">ANALYST</div>
              <div className="text-[9px] text-slate-400">Risk Intel</div>
            </button>

            <button
              type="button"
              onClick={() => setRolePreset("admin@antigravity.gov", "AdminSecurePassword123!")}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center transition"
            >
              <div className="text-[10px] font-bold text-emerald-400">ADMIN</div>
              <div className="text-[9px] text-slate-400">Full System</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
