"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Network, 
  Terminal, 
  Cpu, 
  Zap, 
  Activity, 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Globe, 
  Layers, 
  ArrowUpRight, 
  Sparkles, 
  Star, 
  Users, 
  MessageSquare, 
  Play, 
  Flame, 
  ExternalLink, 
  Compass, 
  Trophy, 
  BookOpen, 
  UserCheck, 
  Search, 
  Bell, 
  Monitor, 
  ArrowRight,
  Send,
  Eye,
  Crosshair,
  Lock,
  Database,
  FileCheck2,
  AlertTriangle,
  Scale,
  GitBranch,
  Server
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"peel" | "smurf" | "mixer">("peel");
  const [guidedMode, setGuidedMode] = useState(true);
  
  // Intake Form State based on Section 6.2 POST /api/v1/investigations/dispatch
  const [seedWallet, setSeedWallet] = useState("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
  const [network, setNetwork] = useState("ETHEREUM");
  const [maxDepth, setMaxDepth] = useState(5);
  const [minUsd, setMinUsd] = useState(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic parallax calculation for true spatial anti-gravity depth
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setDispatchResult({
        task_id: "f5f0b5d9-4ad3-4c9f-b984-904c622ce9df",
        status: "QUEUED",
        event_stream: "/api/v1/investigations/events/f5f0b5d9-4ad3-4c9f-b984-904c622ce9df",
        case_id: "c1f7a22a-5793-4a1b-bd57-a37a13d789e4"
      });
    }, 600);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#030705] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden relative"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(16, 185, 129, 0.14) 0%, transparent 60%),
          radial-gradient(circle at 85% 55%, rgba(5, 150, 105, 0.09) 0%, transparent 50%),
          radial-gradient(circle at 15% 75%, rgba(52, 211, 153, 0.07) 0%, transparent 45%)
        `,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 0. SPATIAL AMBIENCE & 3D HORIZON FLOOR (EXACT COLOR FORMAT)   */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Volumetric Emerald Core Emitter */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-emerald-500/12 rounded-full blur-[150px] transition-transform duration-700 ease-out"
          style={{
            transform: `translate(calc(-50% + ${mousePos.x * 35}px), calc(-50% + ${mousePos.y * 35}px))`
          }}
        />

        {/* Secondary Ambient Light Orb */}
        <div 
          className="absolute top-[60%] right-[8%] w-[550px] h-[550px] bg-teal-500/8 rounded-full blur-[130px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePos.x * -45}px, ${mousePos.y * -45}px)`
          }}
        />

        {/* 3D Cyber Horizon Wireframe Floor */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[650px] opacity-[0.22]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 185, 129, 0.28) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: "perspective(800px) rotateX(65deg) translateY(130px)",
            maskImage: "linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 90%)"
          }}
        />
      </div>

      {/* Main Content Spatial Stack */}
      <div className="relative z-10 pt-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-36">

        {/* ------------------------------------------------------------- */}
        {/* 1. HERO: WEIGHTLESS SPECIFICATION HERO & LEVITATING DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        <section className="relative pt-4 pb-8 flex flex-col items-center text-center">
          
          {/* Floating Announcement Pill */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/35 text-emerald-400 text-xs font-mono shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.25)] mb-8 animate-pulse backdrop-blur-md"
            style={{
              transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -10}px)`
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">SPEC-DRIVEN PLATFORM v1.0.0:</span> 
            <span className="text-slate-300">Automated Multi-Hop Traversal &amp; VASP Attribution</span>
            <ChevronRight className="w-3 h-3 text-emerald-400" />
          </div>

          {/* Headline verbatim from spec.md Section 1.1 & 1.2 */}
          <div className="relative max-w-4xl space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span className="block text-slate-100 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
                Trace Crypto Illicit Flows to
              </span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
                Terminal Cash-Out VASPs
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-400 font-light leading-relaxed pt-2">
              Transform pseudonymous public blockchain fund flows into explainable, legally defensible forensic evidence chains with 
              inductive GraphSAGE clustering and ISO/IEC 27037:2012 certified integrity verification.
            </p>
          </div>

          {/* Dual Floating CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/investigation/new" 
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#021308] font-extrabold text-sm shadow-[0_12px_30px_rgba(16,185,129,0.5),0_0_50px_rgba(52,211,153,0.35)] hover:shadow-[0_16px_45px_rgba(16,185,129,0.7)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 font-mono"
            >
              <span>Dispatch Suspect Intake</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dashboard" 
              className="px-8 py-3.5 rounded-full backdrop-blur-xl bg-slate-900/70 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-400/60 text-slate-200 font-semibold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 font-mono"
            >
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Open Investigator Dashboard</span>
            </Link>
          </div>

          {/* LEVITATING 3D HOLOGRAM DASHBOARD CONSOLE (FORMAT OF REFERENCE IMAGE 1) */}
          <div className="w-full max-w-5xl mt-16 relative perspective-[1400px]">
            
            {/* Satellite A (Top-Left): Mempool Early-Warning Alert from spec.md Section 9.1 & 9.3 */}
            <div 
              className="absolute -top-10 -left-6 md:-left-12 z-30 backdrop-blur-xl bg-[#08170f]/90 border border-emerald-500/35 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.3)] transition-transform duration-300"
              style={{
                transform: `translate3d(${mousePos.x * 28}px, ${mousePos.y * 22}px, 45px) rotateZ(-3deg)`
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left font-mono">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Mempool Scanning (Sec 9.1)</div>
                  <div className="text-xs font-bold text-slate-100">Monitoring Pending Transactions</div>
                  <div className="text-[10px] text-slate-400">Target: ThorChain Router ($12.5k USD)</div>
                </div>
              </div>
            </div>

            {/* Satellite B (Bottom-Right): VASP Attribution from spec.md Section 1.2 & 4 */}
            <div 
              className="absolute -bottom-8 -right-4 md:-right-10 z-30 backdrop-blur-xl bg-[#07150d]/90 border border-teal-500/35 rounded-2xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(20,184,166,0.3)] transition-transform duration-300"
              style={{
                transform: `translate3d(${mousePos.x * -22}px, ${mousePos.y * -28}px, 65px) rotateZ(2deg)`
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-left font-mono">
                  <div className="text-[10px] text-teal-400 uppercase tracking-wider font-bold">Terminal VASP Attribution</div>
                  <div className="text-xs font-bold text-slate-100">Binance &amp; Coinbase Identified</div>
                  <div className="text-[10px] text-emerald-400">99.4% Attribution Confidence</div>
                </div>
              </div>
            </div>

            {/* Central Suspended Console Stage */}
            <div 
              className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/40 via-emerald-950/25 to-transparent shadow-[0_30px_100px_rgba(0,0,0,0.95),0_0_70px_rgba(16,185,129,0.2)] transition-all duration-500 ease-out"
              style={{
                transform: `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg) translateZ(12px)`
              }}
            >
              <div className="rounded-[22px] bg-[#06100a]/95 backdrop-blur-2xl border border-emerald-500/25 overflow-hidden text-left p-6 sm:p-8 space-y-6">
                
                {/* Console Header Bar with Section 2 RBAC & Section 6.2 Payload Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      OPERATOR: <span className="text-emerald-400 font-semibold">ROLE_INVESTIGATOR</span> // SEED: 0x742d...f44e
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>NEO4J GDS + CELERY ONLINE</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-xs font-mono text-emerald-300">
                      LE
                    </div>
                  </div>
                </div>

                {/* Main Hero Card: Explore Forensic Topology with NIST/FATF Holographic Radar Badge */}
                <div className="relative rounded-2xl p-6 bg-gradient-to-r from-emerald-950/60 via-[#091f14] to-[#07160e] border border-emerald-500/30 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <div className="space-y-2 max-w-md">
                    <div className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
                      Section 1.2 Core System Capabilities
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Track Complex Transaction Trails
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Automatically follow the movement of hidden or stolen funds across multiple accounts, blockchains, and complex pathways up to 6 steps away.
                    </p>
                  </div>

                  {/* Circular Holographic Radar Badge */}
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/25 animate-spin" style={{ animationDuration: "24s" }} />
                    <div className="absolute inset-3 rounded-full border border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/70 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(16,185,129,0.45)]">
                      <Shield className="w-6 h-6 text-emerald-400 mb-0.5" />
                      <span className="text-[7.5px] font-mono font-bold text-emerald-200 uppercase">ISO 27037 / FATF</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Card Grid: Three Core Pillars from Section 1.2 & 4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card 1: Interactive Network Map */}
                  <div className="group rounded-xl p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
                      <Network className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">Interactive Network Map</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Visualize how funds split and move through complex networks. Easily track transaction chains up to 6 layers deep.</p>
                    <Link href="/investigation/c1f7a22a-605b-4395-93df-591a0c8b6b66/workspace" className="inline-block mt-3 text-[11px] font-semibold text-emerald-400 group-hover:underline font-mono">
                      Open Visual Map →
                    </Link>
                  </div>

                  {/* Card 2: AI Identity Grouping */}
                  <div className="group rounded-xl p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">AI Identity Grouping</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Uses advanced AI to connect different wallets and accounts, identifying the single suspect or group controlling them.</p>
                    <Link href="/investigation/c1f7a22a-605b-4395-93df-591a0c8b6b66/entity-profiler" className="inline-block mt-3 text-[11px] font-semibold text-emerald-400 group-hover:underline font-mono">
                      View Suspect Profile →
                    </Link>
                  </div>

                  {/* Card 3: Court-Ready Evidence */}
                  <div className="group rounded-xl p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
                      <Scale className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">Court-Ready Evidence</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Export securely packaged, tamper-proof digital evidence that includes trusted timestamps and is ready for legal proceedings.</p>
                    <Link href="/evidence/c1f7a22a-605b-4395-93df-591a0c8b6b66/export" className="inline-block mt-3 text-[11px] font-semibold text-emerald-400 group-hover:underline font-mono">
                      Download Evidence report →
                    </Link>
                  </div>
                </div>

                {/* Live Threat Matrix Leaderboard & Absorbed Illicit Volume Ribbon (Section 9.3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl p-4 bg-black/50 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">THREAT MATRIX RANKING (SEC 9.3)</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">0x742d...f44e <span className="text-rose-400 text-xs">(Threat Score: 95.0)</span></div>
                    </div>
                    <div className="flex gap-1.5 font-mono">
                      <span className="px-2 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-300">AUTO-FREEZE ELIGIBLE</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 bg-black/50 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">VASP ABSORPTION TOTAL (SEC 4)</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">$71,250.00 USD Absorbed</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                      </div>
                      <span className="text-xs font-mono text-emerald-400">Binance / Coinbase</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Standards & Regulatory Frameworks Ribbon */}
          <div className="mt-16 w-full max-w-4xl">
            <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase mb-6 text-center">
              Statutory Admissibility Standards &bull; Technical Specifications
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60 hover:opacity-100 transition duration-300 font-mono text-xs text-slate-300 font-bold">
              <span>ISO/IEC 27037:2012</span>
              <span>18 U.S.C. § 981</span>
              <span>18 U.S.C. § 1956</span>
              <span>FATF TRAVEL RULE</span>
              <span>FINCEN SAR FORM 111</span>
              <span>NEO4J GDS 2.X</span>
              <span>PYTORCH GEOMETRIC</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2. TOPOLOGICAL ANOMALY DETECTION (IMAGE 2 FORMAT)             */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Section 1.2 &bull; Topological Anomaly Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Suspicious Activity Patterns
              </h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Automatically flags common methods used to hide illicit funds, such as breaking large sums into smaller transactions, rapidly moving money across multiple accounts, or mixing funds to cover their tracks.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-full border border-slate-800 font-mono">
              <button 
                onClick={() => setActiveTab("peel")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeTab === "peel" ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-slate-400 hover:text-white"
                }`}
              >
                Peel Chains
              </button>
              <button 
                onClick={() => setActiveTab("smurf")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeTab === "smurf" ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-slate-400 hover:text-white"
                }`}
              >
                Smurfing Fan-Out
              </button>
              <button 
                onClick={() => setActiveTab("mixer")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeTab === "mixer" ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-slate-400 hover:text-white"
                }`}
              >
                Cyclic Mixers
              </button>
            </div>
          </div>

          {/* Asymmetric Floating Card Cluster */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Card 1: Tracking Hidden Transfers */}
            <div 
              className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-900/90 to-black/85 border border-emerald-500/25 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.12)] transition-transform duration-300 hover:-translate-y-2 hover:border-emerald-400/40"
              style={{
                transform: `translateY(${mousePos.y * -12}px)`
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tracking Hidden Transfers</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Detects when a large sum of money is slowly &quot;peeled&quot; away into smaller amounts across multiple steps to hide where the bulk of the funds are ultimately going.
              </p>

              {/* Node Constellation Visualizer Preview */}
              <div className="relative h-44 rounded-2xl bg-black/70 border border-slate-800 p-4 overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>CYTOSCAPE.JS // DAGRE</span>
                  <span className="text-emerald-400">HOP DEPTH: 1-6</span>
                </div>

                <svg className="w-full h-24 my-auto">
                  <line x1="20" y1="50" x2="80" y2="20" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeDasharray="3 3" />
                  <line x1="80" y1="20" x2="160" y2="60" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" />
                  <line x1="160" y1="60" x2="220" y2="25" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" />
                  
                  <circle cx="20" cy="50" r="5" fill="#10b981" />
                  <circle cx="80" cy="20" r="7" fill="#34d399" />
                  <circle cx="160" cy="60" r="6" fill="#10b981" />
                  <circle cx="220" cy="25" r="8" fill="#6ee7b7" />
                </svg>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-300">Guided Traversal</span>
                  <button 
                    onClick={() => setGuidedMode(!guidedMode)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${guidedMode ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-transform ${guidedMode ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Rapid Account Splitting */}
            <div 
              className="relative rounded-3xl p-6 bg-gradient-to-b from-[#091b12]/90 to-black/90 border border-teal-500/30 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(20,184,166,0.18)] transition-transform duration-300 hover:-translate-y-2 hover:border-teal-400/50"
              style={{
                transform: `translateY(${mousePos.y * 14}px)`
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Rapid Account Splitting</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Spots when funds are quickly divided and sent to many different temporary wallets, especially when moved across different blockchain networks to avoid detection.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-200">Smurfing</div>
                    <span className="text-[9px] text-emerald-400">Fan-Out</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-200">Bridge</div>
                    <span className="text-[9px] text-amber-400">Cross-Chain</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-200">Mixer</div>
                    <span className="text-[9px] text-rose-400">Pool Alert</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 font-mono">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ETHEREUM</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">BITCOIN UTXO</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TRON TRC-20</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">POLYGON</span>
                </div>
              </div>
            </div>

            {/* Card 3: Exchange Tracing */}
            <div 
              className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-900/90 to-black/85 border border-emerald-500/25 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.12)] transition-transform duration-300 hover:-translate-y-2 hover:border-emerald-400/40"
              style={{
                transform: `translateY(${mousePos.y * -8}px)`
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Exchange Tracing</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Identifies when funds end up at known crypto exchanges and traces the transaction path backwards to uncover the original sender or controller.
              </p>

              <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0b2416] to-black border border-emerald-400/35 shadow-[0_0_20px_rgba(16,185,129,0.25)] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400">REGISTRY MATCH: VASP-001</span>
                    <h4 className="text-base font-extrabold text-white mt-0.5">Binance Global Deposit</h4>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 font-mono">
                  18 U.S.C. § 981 Preservation Mandate
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-emerald-950 pt-2 font-mono">
                  <span>SHA-256 SIGNED</span>
                  <span className="text-emerald-400">TRAVEL RULE COMPLIANT</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 3. ENTERPRISE ROADMAP: 105 FEATURES (IMAGE 2 BOTTOM FORMAT)   */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Section 9 &bull; Enterprise Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Enterprise 105-Feature Intelligence Roadmap
            </h2>
            <p className="text-sm text-slate-400">
              Government-grade intelligence suite meeting statutory admissibility standards (18 U.S.C. § 981 / 1956) and law enforcement forensic requirements across 10 core domains.
            </p>
          </div>

          {/* Asymmetric Dual Impact Cluster */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Massive Metric Card (7 cols) */}
            <div 
              className="lg:col-span-7 rounded-3xl p-8 bg-gradient-to-br from-emerald-950/45 via-slate-900/80 to-black/90 border border-emerald-500/35 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(16,185,129,0.18)] flex flex-col justify-between space-y-8"
              style={{
                transform: `translateY(${mousePos.y * 10}px)`
              }}
            >
              <div className="space-y-2">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                  FULL-STACK INTELLIGENCE SPECIFICATION
                </span>
                <h3 className="text-2xl font-bold text-white">
                  105 Specialized Forensic Capabilities
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(16,185,129,0.45)] font-mono">
                  105<span className="text-emerald-400">/105</span>
                </span>
                <span className="text-xs text-slate-400 max-w-xs leading-relaxed font-mono">
                  Features covering multi-chain expansion, GNN AI copilot queries, mempool scanning, automated subpoena generation, and air-gapped SCIF deployment.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold font-mono">
                  10 Domains: Ingestion &bull; GNN &bull; Real-Time &bull; Legal
                </span>
                <Link href="/dashboard" className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 font-bold">
                  Explore Active Cases <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Architecture Blueprint Card (5 cols) */}
            <div 
              className="lg:col-span-5 rounded-3xl p-7 bg-gradient-to-b from-[#07190f] to-black border border-emerald-500/30 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-6"
              style={{
                transform: `translateY(${mousePos.y * -10}px)`
              }}
            >
              <div className="flex items-center justify-between font-mono">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] text-emerald-300 font-bold">
                  SECTION 3 ARCHITECTURE
                </span>
                <span className="text-[10px] text-slate-500">FASTAPI + PYG</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-400">Presentation:</span>
                  <span className="text-emerald-400 font-bold">Next.js 14 + Cytoscape</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-400">Application Gateway:</span>
                  <span className="text-emerald-400 font-bold">FastAPI + JWT RS256</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-400">Graph DBMS:</span>
                  <span className="text-emerald-400 font-bold">Neo4j 5.x + GDS 2.x</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-400">Task &amp; Inference:</span>
                  <span className="text-emerald-400 font-bold">Redis 7 + Celery + PyG</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Deterministic clustering with SHAP marginal feature attribution.
              </div>
            </div>

          </div>

          {/* Database Entities Strip (PostgreSQL + Neo4j) */}
          <div className="p-6 rounded-2xl bg-black/50 border border-slate-800/80 flex flex-wrap items-center justify-around gap-6 text-slate-400 font-mono text-xs font-bold">
            <span>POSTGRESQL 16: CASES &bull; SUSPECT_WALLETS &bull; EVIDENCE_REPORTS</span>
            <span>NEO4J: (:WALLET)-[:SENT]-&gt;(:TRANSACTION)</span>
            <span>REDIS 7: PUB/SUB &bull; SSE STREAMING</span>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. ASYNCHRONOUS INFERENCE PIPELINE (IMAGE 3 FORMAT)          */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-16">
          
          {/* Split Inference Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                <GitBranch className="w-4 h-4" />
                <span>Section 6.3 &bull; Asynchronous Inference Pipeline</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Inductive GraphSAGE GNN &amp; Explainability Engine
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Worker queries the Neo4j GDS projection to transform localized subgraphs into PyTorch Geometric tensors for deep topological representation learning.
              </p>

              <div className="space-y-3 pt-2 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>64-dimensional feature vector extraction per wallet node</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>3-Layer GraphSAGE with LeakyReLU activation &amp; 32-dim latent embedding</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>SHAP explainability attributing exact behavioral rules triggering flags</span>
                </div>
              </div>

              <div className="pt-2">
                <Link 
                  href="/investigation/c1f7a22a-605b-4395-93df-591a0c8b6b66/entity-profiler"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition shadow-[0_0_20px_rgba(16,185,129,0.2)] font-mono"
                >
                  <span>Inspect GNN Entity Profiler</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Levitating GNN Radar Card */}
            <div 
              className="relative rounded-3xl p-8 bg-gradient-to-br from-[#06180e] via-[#05110a] to-black border border-emerald-400/35 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.95),0_0_45px_rgba(16,185,129,0.22)] space-y-6"
              style={{
                transform: `rotateX(${mousePos.y * 6}deg) rotateY(${mousePos.x * -6}deg)`
              }}
            >
              <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
                <div className="flex items-center gap-2 font-mono">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">PyTorch Geometric Engine</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  MODEL: GRAPHSAGE-V1.PTH
                </span>
              </div>

              <div className="relative h-48 rounded-2xl bg-black/70 border border-emerald-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,transparent_70%)]" />
                <div className="w-24 h-24 rounded-full border border-emerald-500/35 flex items-center justify-center animate-ping" style={{ animationDuration: "4s" }} />
                <div className="w-16 h-16 rounded-full bg-emerald-500/25 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.6)]">
                  <Activity className="w-7 h-7" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                Real-time node embeddings aggregated across 1st, 2nd, and 3rd degree neighborhood tensors.
              </p>
            </div>

          </div>

          {/* SSE Stream Banner (Image 3 Bottom Perspective Grid Format) */}
          <div 
            className="relative rounded-3xl p-10 sm:p-16 bg-gradient-to-b from-[#07190f]/95 via-[#040e08] to-black border border-emerald-500/35 overflow-hidden text-center space-y-6 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_55px_rgba(16,185,129,0.22)]"
          >
            {/* Background 3D grid illusion */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(rgba(16, 185, 129, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.35) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />

            <div className="relative z-10 max-w-4xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-bold">
                  SECTION 6.2 SSE PROGRESS CHANNEL
                </span>
              </div>

              <div className="flex items-center justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-black/80 border border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.18)] max-w-full">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs sm:text-sm font-black border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    GET
                  </span>
                  <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight font-mono break-all sm:break-normal select-all">
                    /api/v1/investigations/events/<span className="text-emerald-400">&#123;task_id&#125;</span>
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed font-mono max-w-2xl mx-auto">
                Server-Sent Events streaming live progress updates: GRAPH_EXPANSION &bull; GNN_CLUSTERING &bull; VASP_ATTRIBUTION directly into the workspace canvas.
              </p>
            </div>

            <div className="relative z-10 pt-2 flex justify-center">
              <Link 
                href="/investigation/new" 
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(52,211,153,0.7)] transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-0.5 font-mono"
              >
                <Zap className="w-4 h-4" />
                <span>Dispatch Intake &amp; Stream Graph</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 5. USER ROLES & VERIFICATION (IMAGE 4 FORMAT)                */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-16">
          
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-bold">
                  SECTION 2 &bull; SECURITY PROFILES
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">Role-Based Access Control (RBAC via JWT RS256)</h3>
              </div>
              <Link href="/login" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1">
                Access Gateway <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              
              {/* Role 1 */}
              <div className="rounded-2xl p-6 bg-slate-900/45 border border-slate-800 backdrop-blur-md space-y-4 hover:border-emerald-500/35 transition transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">ROLE_INVESTIGATOR</span>
                  <Shield className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Initialize suspect wallet searches, create case files, trigger background graph queries, inspect multi-hop canvas, and export ISO/IEC 27037 forensic packages.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                  Perm: Read, Write Cases, Export Evidence
                </div>
              </div>

              {/* Role 2 */}
              <div className="rounded-2xl p-6 bg-slate-900/45 border border-slate-800 backdrop-blur-md space-y-4 hover:border-emerald-500/35 transition transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">ROLE_ANALYST</span>
                  <Activity className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Annotate graph nodes, enrich VASP registry metadata, modify risk thresholds, run reverse fund-flow analytics, and review GNN entity resolution confidence scores.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                  Perm: Enrich Graph, VASP Registry, Risk Review
                </div>
              </div>

              {/* Role 3 */}
              <div className="rounded-2xl p-6 bg-slate-900/45 border border-slate-800 backdrop-blur-md space-y-4 hover:border-emerald-500/35 transition transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">ROLE_ADMIN</span>
                  <Lock className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Full administrative control: user provisioning, role assignments, API rate-limiting rules, worker concurrency, and cryptographic signing key rotations.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                  Perm: User Provisioning, Key Rotation, Worker Control
                </div>
              </div>

            </div>
          </div>

          {/* Section 8 Verification Test Suite Callouts */}
          <div className="space-y-8">
            <div className="flex justify-between items-end font-mono">
              <div>
                <span className="text-xs text-emerald-400 tracking-widest uppercase font-bold">SECTION 8 VERIFICATION PROTOCOL</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">End-to-End System Test Suite</h3>
              </div>
              <span className="text-xs text-emerald-400">STATUS: VERIFIED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              
              <div className="group rounded-2xl overflow-hidden bg-slate-900/45 border border-slate-800 hover:border-emerald-500/40 transition duration-300 p-5 space-y-3">
                <div className="text-xs text-emerald-400 font-bold">TEST 8.1 &bull; RELATIONAL INTEGRITY</div>
                <div className="text-sm font-bold text-white">PostgreSQL 16 Engine</div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  ACID-compliant storage for users, authentication claims, cases, evidence logs, and immutable chain-of-custody audit trails.
                </p>
                <div className="text-[10px] text-slate-500">Endpoint: /api/v1/health/db-sql</div>
              </div>

              <div className="group rounded-2xl overflow-hidden bg-slate-900/45 border border-slate-800 hover:border-emerald-500/40 transition duration-300 p-5 space-y-3">
                <div className="text-xs text-teal-400 font-bold">TEST 8.2 &bull; GRAPH TRAVERSAL</div>
                <div className="text-sm font-bold text-white">Neo4j 5.x Graph DBMS</div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Native graph storage executing recursive multi-hop Cypher queries with in-memory Graph Data Science (GDS) projections.
                </p>
                <div className="text-[10px] text-slate-500">Endpoint: /api/v1/health/db-graph</div>
              </div>

              <div className="group rounded-2xl overflow-hidden bg-slate-900/45 border border-slate-800 hover:border-emerald-500/40 transition duration-300 p-5 space-y-3">
                <div className="text-xs text-cyan-400 font-bold">TEST 8.3 &bull; TASK PIPELINE</div>
                <div className="text-sm font-bold text-white">Redis 7 &bull; Celery 5.3+</div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Distributed asynchronous task queue for blockchain RPC indexing, subgraph extraction, and PyG GNN inference loops.
                </p>
                <div className="text-[10px] text-slate-500">Command: celery inspect ping</div>
              </div>

            </div>
          </div>

        </section>

        {/* ------------------------------------------------------------- */}
        {/* 6. SUSPECT INTAKE DISPATCH CONSOLE (IMAGE 5 FORMAT)          */}
        {/* ------------------------------------------------------------- */}
        <section id="intake-form" className="relative flex justify-center">
          
          <div 
            className="w-full max-w-2xl rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-[#07180f]/95 via-black to-black border border-emerald-500/35 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(16,185,129,0.2)] space-y-8 text-center"
            style={{
              transform: `translateY(${mousePos.y * -6}px)`
            }}
          >
            <div className="space-y-3">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                SECTION 6.2 &bull; POST /api/v1/investigations/dispatch
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Dispatch Target Suspect Investigation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed font-mono">
                Ingest victim-reported suspect wallet seeds across Ethereum, Bitcoin, Tron, or Polygon to trigger autonomous multi-hop traversal.
              </p>
            </div>

            {dispatchResult ? (
              <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 space-y-4 text-left font-mono">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 animate-pulse" />
                  <span>INVESTIGATION TASK DISPATCHED (HTTP 202)</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div>Task ID: <span className="text-emerald-300">{dispatchResult.task_id}</span></div>
                  <div>Status: <span className="text-cyan-300">{dispatchResult.status}</span></div>
                  <div>Event Stream: <span className="text-slate-400">{dispatchResult.event_stream}</span></div>
                </div>
                <div className="pt-2 flex gap-3">
                  <Link 
                    href={`/investigation/${dispatchResult.case_id}/workspace`}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
                  >
                    Open Live Canvas
                  </Link>
                  <button 
                    onClick={() => setDispatchResult(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    Dispatch Another
                  </button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleDispatch}
                className="space-y-4 text-left font-mono"
              >
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">SEED SUSPECT WALLET ADDRESS</label>
                  <input 
                    type="text" 
                    required
                    value={seedWallet}
                    onChange={(e) => setSeedWallet(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                    placeholder="0x... or bc1q..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">NETWORK</label>
                    <select 
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-400 transition"
                    >
                      <option value="ETHEREUM">ETHEREUM (ERC-55)</option>
                      <option value="BITCOIN">BITCOIN (Bech32/UTXO)</option>
                      <option value="TRON">TRON (TRC-20 USDT)</option>
                      <option value="POLYGON">POLYGON (EVM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">MAX HOP DEPTH</label>
                    <input 
                      type="number" 
                      min="1"
                      max="6"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">MIN USD THRESHOLD</label>
                    <input 
                      type="number" 
                      min="0"
                      step="100"
                      value={minUsd}
                      onChange={(e) => setMinUsd(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(52,211,153,0.7)] transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Dispatching Celery Task..." : "Dispatch Autonomous Investigation"}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>

        </section>

      </div>

    </div>
  );
}
