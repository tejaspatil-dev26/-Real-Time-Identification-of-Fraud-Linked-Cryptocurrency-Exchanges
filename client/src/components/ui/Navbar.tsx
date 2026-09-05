"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Network, Database, FileCheck2, LogOut, User as UserIcon, PlusCircle } from "lucide-react";
import { ApiClient } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("forensics_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const handleLogout = () => {
    ApiClient.clearToken();
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Shield },
    { label: "New Investigation", href: "/investigation/new", icon: PlusCircle },
    { label: "VASP Registry", href: "/vasp-registry", icon: Database },
  ];

  return (
    <nav className="border-b border-emerald-500/20 bg-[#040906]/90 backdrop-blur sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Network className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <Link href="/dashboard" className="text-lg font-bold tracking-wider text-slate-100 flex items-center gap-2 font-mono">
                CRYPTO<span className="text-emerald-400">TRACE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-mono shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  ISO 27037
                </span>
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 font-mono text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User profile & action */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.full_name || "Investigator"}</div>
                  <div className="text-[10px] text-emerald-400 font-mono tracking-tight">{user.agency_or_firm || user.role}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
