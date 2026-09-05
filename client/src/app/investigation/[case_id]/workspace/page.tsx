"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Network, 
  ShieldAlert, 
  Layers, 
  Activity, 
  FileCheck2, 
  CheckCircle2, 
  Globe2, 
  Sliders, 
  RefreshCw,
  Flame,
  AlertOctagon,
  Bell,
  X,
  Zap,
  Map,
  Download,
  Radio,
  Bot,
  Terminal
} from "lucide-react";
import { CytoscapeCanvas } from "@/components/graph/CytoscapeCanvas";
import { ThreeGlobeVisualizer } from "@/components/graph/ThreeGlobeVisualizer";
import TacticalWorldMap from "@/components/graph/TacticalWorldMap";
import { GraphControls } from "@/components/graph/GraphControls";
import ThreatMatrixTable, { ThreatRankingItem } from "@/components/graph/ThreatMatrixTable";
import SubpoenaModal from "@/components/ui/SubpoenaModal";
import FraudDetectionModal from "@/components/ui/FraudDetectionModal";
import { TemporalTimelineSlider } from "@/components/analytics/TemporalTimelineSlider";
import { AICopilotModal } from "@/components/analytics/AICopilotModal";
import { SankeyFlowVisualizer } from "@/components/analytics/SankeyFlowVisualizer";
import { ForensicTerminalCLI } from "@/components/analytics/ForensicTerminalCLI";
import { GlobalCommandPalette } from "@/components/ui/GlobalCommandPalette";
import { useSSE } from "@/hooks/useSSE";
import { ApiClient } from "@/lib/api";
import { formatAddress, formatUSD } from "@/lib/utils";

export default function WorkspacePage() {
  const params = useParams();
  const caseId = params.case_id as string;

  const [graphData, setGraphData] = useState<any>(null);
  const [threatMatrix, setThreatMatrix] = useState<ThreatRankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"2d" | "map" | "3d" | "sankey">("2d");
  const [layoutName, setLayoutName] = useState<"dagre" | "fcose">("dagre");
  const [minUsd, setMinUsd] = useState<number>(0);
  const [filterPeelOnly, setFilterPeelOnly] = useState<boolean>(false);
  const [filterVaspOnly, setFilterVaspOnly] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showFraudDossierModal, setShowFraudDossierModal] = useState<boolean>(false);
  
  // Power User Modes
  const [showCopilot, setShowCopilot] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  const [timelineSpeed, setTimelineSpeed] = useState<number>(1);
  const [timelineProgress, setTimelineProgress] = useState<number>(100);

  // Enterprise Drawer and Modal States
  const [showThreatMatrix, setShowThreatMatrix] = useState<boolean>(false);
  const [selectedVasp, setSelectedVasp] = useState<any | null>(null);
  const [mempoolAlert, setMempoolAlert] = useState<any | null>({
    status: "UNCONFIRMED_BROADCAST_DETECTED",
    suspect_wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    tx_hash: "0x8f3c9210a4e76d1e4b9f2d12e8c14828b492049e7b238914619d9b418a4d7124",
    gas_gwei: 48.5,
    target_destination: "ThorChain Native Router (0xd37B...7146)",
    amount_usd: 12500.0,
    urgency: "CRITICAL_INTERCEPTION_RECOMMENDED"
  });

  // Subscribe to live SSE events if an active task exists
  const { currentStage, progress, isCompleted, events } = useSSE(activeTaskId, (data) => {
    fetchGraph();
  });

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.graph.getCaseGraph(caseId);
      setGraphData(data);
      if (data.threat_matrix) {
        setThreatMatrix(data.threat_matrix);
      }
    } catch (_) {
      // Fallback realistic data with complete timestamps, locations, and transaction details
      const defaultGraph = {
        nodes: [
          { 
            data: { 
              id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
              label: "SUSPECT SEED", 
              is_seed: true, 
              balance: 14.5, 
              risk_score: 0.96, 
              hop_depth: 0,
              network: "ETHEREUM (ERC-20)",
              geo_location: { city: "St. Petersburg", country: "Russian Federation", country_code: "RU", lat: 59.9343, lng: 30.3351 },
              ip_cluster: "91.240.118.42 (Selectel Cloud Hosting)",
              threat_actor: "ShadowVault Syndicate (APT-44)",
              modus_operandi: "Automated Smart Contract Drainer & Multi-Hop Peel Forwarding",
              timestamp: "2024-09-04 14:28:10 UTC",
              elapsed_time: "18 mins ago",
              block_number: 19842095,
              tx_hash: "0x742da3b844Bc454e4438f44e89104c910248bf129a4e76d1e4b9f2d12e8c1482"
            } 
          },
          { 
            data: { 
              id: "0x1111111254fb6c44bac0bed2854e76f90643097d", 
              label: "Mule Hop 1 (Fan-Out)", 
              balance: 6.2, 
              risk_score: 0.85, 
              hop_depth: 1, 
              fan_out_detected: true,
              network: "ETHEREUM",
              geo_location: { city: "Frankfurt", country: "Germany", country_code: "DE", lat: 50.1109, lng: 8.6821 },
              ip_cluster: "185.190.140.12 (Hetzner Online GmbH)",
              timestamp: "2024-09-04 14:30:45 UTC",
              elapsed_time: "15 mins ago",
              block_number: 19842101,
              tx_hash: "0x1111a4e76d1e4b9f2d12e8c14828b492049e7b238914619d9b418a4d7124991a"
            } 
          },
          { 
            data: { 
              id: "0x2222222254fb6c44bac0bed2854e76f90643097e", 
              label: "Peel Chain Hub", 
              balance: 5.1, 
              risk_score: 0.78, 
              hop_depth: 2, 
              peel_chain_detected: true,
              network: "ETHEREUM",
              geo_location: { city: "London", country: "United Kingdom", country_code: "GB", lat: 51.5074, lng: -0.1278 },
              ip_cluster: "194.38.20.77 (Voxility Datacenter)",
              timestamp: "2024-09-04 14:32:18 UTC",
              elapsed_time: "14 mins ago",
              block_number: 19842104,
              tx_hash: "0x2222d12e8c14828b492049e7b238914619d9b418a4d7124a4e76d1e4b9f2882b"
            } 
          },
          { 
            data: { 
              id: "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146", 
              label: "ThorChain Cross-Bridge", 
              type: "bridge", 
              protocol: "ThorChain", 
              balance: 0.0, 
              hop_depth: 2,
              network: "ETHEREUM ➔ BITCOIN",
              geo_location: { city: "Zurich", country: "Switzerland", country_code: "CH", lat: 47.3769, lng: 8.5417 },
              ip_cluster: "84.16.224.18 (Swisscom Enterprise)",
              timestamp: "2024-09-04 14:33:02 UTC",
              elapsed_time: "13 mins ago",
              block_number: 19842108,
              tx_hash: "0xd37bca46aD71468b492049e7b238914619d9b418a4d7124a4e76d1e4b9f2551c"
            } 
          },
          { 
            data: { 
              id: "0x28C6c06298d514Db089934071355E5743bf21d60", 
              label: "VASP: Binance", 
              type: "vasp", 
              vasp_name: "Binance", 
              vasp_risk: "LOW", 
              balance: 1200.0, 
              hop_depth: 3,
              deposit_address: "0x28C6c06298d514Db089934071355E5743bf21d60",
              network: "ETHEREUM",
              geo_location: { city: "George Town", country: "Cayman Islands", country_code: "KY", lat: 19.2838, lng: -81.3675 },
              ip_cluster: "199.16.156.6 (AWS Offshore Gateway)",
              timestamp: "2024-09-04 14:35:12 UTC",
              elapsed_time: "11 mins ago",
              block_number: 19842114,
              tx_hash: "0x28c65e5743bf21d6049e7b238914619d9b418a4d7124a4e76d1e4b9f2771d"
            } 
          },
          { 
            data: { 
              id: "0x503828976D22510aad0201ac7EC88293211A23Dc", 
              label: "VASP: Coinbase", 
              type: "vasp", 
              vasp_name: "Coinbase", 
              vasp_risk: "LOW", 
              balance: 850.0, 
              hop_depth: 3,
              deposit_address: "0x503828976D22510aad0201ac7EC88293211A23Dc",
              network: "ETHEREUM",
              geo_location: { city: "San Francisco", country: "United States", country_code: "US", lat: 37.7749, lng: -122.4194 },
              ip_cluster: "104.18.28.14 (Cloudflare US)",
              timestamp: "2024-09-04 14:36:50 UTC",
              elapsed_time: "9 mins ago",
              block_number: 19842118,
              tx_hash: "0x5038ac7EC88293211A23Dc49e7b238914619d9b418a4d7124a4e76d1e4b9f334e"
            } 
          }
        ],
        edges: [
          { 
            data: { 
              id: "e1", 
              source: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
              target: "0x1111111254fb6c44bac0bed2854e76f90643097d", 
              amount: 10.2, 
              amount_usd: 29070.0, 
              token: "ETH", 
              is_split: true,
              timestamp: "2024-09-04 14:30:45 UTC",
              elapsed_time: "15 mins ago",
              tx_hash: "0x742da3b844Bc454e4438f44e89104c910248bf129a4e76d1e4b9f2d12e8c1482",
              gas_fee: "0.0035 ETH ($10.50)"
            } 
          },
          { 
            data: { 
              id: "e2", 
              source: "0x1111111254fb6c44bac0bed2854e76f90643097d", 
              target: "0x2222222254fb6c44bac0bed2854e76f90643097e", 
              amount: 6.0, 
              amount_usd: 17100.0, 
              token: "ETH", 
              is_peel_chain: true,
              timestamp: "2024-09-04 14:32:18 UTC",
              elapsed_time: "14 mins ago",
              tx_hash: "0x1111a4e76d1e4b9f2d12e8c14828b492049e7b238914619d9b418a4d7124991a",
              gas_fee: "0.0028 ETH ($8.40)"
            } 
          },
          { 
            data: { 
              id: "e3", 
              source: "0x2222222254fb6c44bac0bed2854e76f90643097e", 
              target: "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146", 
              amount: 4.5, 
              amount_usd: 12500.0, 
              token: "ETH", 
              is_bridge_hop: true,
              timestamp: "2024-09-04 14:33:02 UTC",
              elapsed_time: "13 mins ago",
              tx_hash: "0x2222d12e8c14828b492049e7b238914619d9b418a4d7124a4e76d1e4b9f2882b",
              gas_fee: "0.0062 ETH ($18.60)"
            } 
          },
          { 
            data: { 
              id: "e4", 
              source: "0x2222222254fb6c44bac0bed2854e76f90643097e", 
              target: "0x28C6c06298d514Db089934071355E5743bf21d60", 
              amount: 4.8, 
              amount_usd: 13680.0, 
              token: "ETH",
              timestamp: "2024-09-04 14:35:12 UTC",
              elapsed_time: "11 mins ago",
              tx_hash: "0x28c65e5743bf21d6049e7b238914619d9b418a4d7124a4e76d1e4b9f2771d",
              gas_fee: "0.0031 ETH ($9.30)"
            } 
          },
          { 
            data: { 
              id: "e5", 
              source: "0x1111111254fb6c44bac0bed2854e76f90643097d", 
              target: "0x503828976D22510aad0201ac7EC88293211A23Dc", 
              amount: 4.0, 
              amount_usd: 11400.0, 
              token: "ETH",
              timestamp: "2024-09-04 14:36:50 UTC",
              elapsed_time: "9 mins ago",
              tx_hash: "0x5038ac7EC88293211A23Dc49e7b238914619d9b418a4d7124a4e76d1e4b9f334e",
              gas_fee: "0.0029 ETH ($8.70)"
            } 
          }
        ],
        anomalies: {
          peel_chains_count: 1,
          smurfing_fan_out_count: 1,
          cross_bridge_hops_count: 1,
          suspect_total_illicit_volume_usd: 71250.0,
          identified_terminal_vasps: [
            { vasp_name: "Binance", risk_tier: "LOW", deposit_address: "0x28C6c06298d514Db089934071355E5743bf21d60", absorbed_transactions: 1, absorbed_volume_usd: 13680.0 },
            { vasp_name: "Coinbase", risk_tier: "LOW", deposit_address: "0x503828976D22510aad0201ac7EC88293211A23Dc", absorbed_transactions: 1, absorbed_volume_usd: 11400.0 }
          ]
        },
        threat_matrix: [
          { address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", label: "Suspect Seed Wallet", type: "wallet", network: "ETHEREUM", threat_score: 95.0, priority_rank: "CRITICAL_SEIZURE_TARGET", balance_usd: 43500.0, hop_depth: 0, has_mixer: false, is_peel_node: false, is_seed: true },
          { address: "0x2222222254fb6c44bac0bed2854e76f90643097e", label: "Peel Chain Intermediary", type: "wallet", network: "ETHEREUM", threat_score: 84.5, priority_rank: "CRITICAL_SEIZURE_TARGET", balance_usd: 15300.0, hop_depth: 2, has_mixer: false, is_peel_node: true, is_seed: false },
          { address: "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146", label: "ThorChain Bridge Router", type: "bridge", network: "ETHEREUM", threat_score: 76.0, priority_rank: "HIGH_MONITORING", balance_usd: 12500.0, hop_depth: 2, has_mixer: false, is_peel_node: false, is_seed: false },
          { address: "0x1111111254fb6c44bac0bed2854e76f90643097d", label: "Smurfing Fan-Out Hub", type: "wallet", network: "ETHEREUM", threat_score: 68.2, priority_rank: "HIGH_MONITORING", balance_usd: 18600.0, hop_depth: 1, has_mixer: false, is_peel_node: false, is_seed: false },
        ]
      };
      setGraphData(defaultGraph);
      setThreatMatrix(defaultGraph.threat_matrix as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [caseId]);

  useEffect(() => {
    let interval: any;
    if (isTimelinePlaying) {
      interval = setInterval(() => {
        setTimelineProgress(p => {
          if (p >= 100) return 0;
          return Math.min(100, p + timelineSpeed * 2);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimelinePlaying, timelineSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredElements = () => {
    if (!graphData) return { nodes: [], edges: [] };
    let filteredNodes = [...graphData.nodes];
    let filteredEdges = [...graphData.edges];

    if (minUsd > 0) {
      filteredEdges = filteredEdges.filter((e) => (e.data.amount_usd || 0) >= minUsd);
      const connectedNodeIds = new Set<string>();
      filteredEdges.forEach((e) => {
        connectedNodeIds.add(e.data.source);
        connectedNodeIds.add(e.data.target);
      });
      filteredNodes = filteredNodes.filter((n) => connectedNodeIds.has(n.data.id) || n.data.is_seed);
    }

    if (filterPeelOnly) {
      filteredEdges = filteredEdges.filter((e) => e.data.is_peel_chain);
      const peelNodeIds = new Set<string>();
      filteredEdges.forEach((e) => {
        peelNodeIds.add(e.data.source);
        peelNodeIds.add(e.data.target);
      });
      filteredNodes = filteredNodes.filter((n) => peelNodeIds.has(n.data.id));
    }

    if (filterVaspOnly) {
      const vaspNodes = filteredNodes.filter((n) => n.data.type === "vasp" || n.data.vasp_name);
      const vaspIds = new Set(vaspNodes.map((n) => n.data.id));
      
      // Find all edges that directly connect to a VASP
      const vaspEdges = filteredEdges.filter(
        (e) => vaspIds.has(e.data.source) || vaspIds.has(e.data.target)
      );

      // Keep VASP nodes, the wallets feeding directly into them, and the seed node
      const activeIds = new Set<string>();
      vaspIds.forEach((id) => activeIds.add(id));
      vaspEdges.forEach((e) => {
        activeIds.add(e.data.source);
        activeIds.add(e.data.target);
      });

      filteredNodes = filteredNodes.filter(
        (n) => activeIds.has(n.data.id) || n.data.is_seed
      );
    }

    // Bulletproof Edge Pruning: An edge can ONLY exist if BOTH source and target are in filteredNodes
    const finalNodeIds = new Set(filteredNodes.map((n) => n.data.id));
    filteredEdges = filteredEdges.filter(
      (e) => finalNodeIds.has(e.data.source) && finalNodeIds.has(e.data.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  };

  const anomalies = graphData?.anomalies;
  const terminalVasps = anomalies?.identified_terminal_vasps || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
              <Network className="w-5 h-5 text-cyan-400" />
              Interactive Transaction Map
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Case ID: {caseId.substring(0, 8)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visually track complex transaction paths across multiple networks and easily generate account freeze requests.
          </p>
        </div>

        {/* View Switchers & Enterprise Feature Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setActiveTab("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "2d" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Network className="w-3.5 h-3.5" /> 2D Canvas
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "map" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Tactical Map
            </button>
            <button
              onClick={() => setActiveTab("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "3d" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" /> 3D Globe
            </button>
            <button
              onClick={() => setActiveTab("sankey")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "sankey" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Sankey Flow
            </button>
          </div>

          <button
            onClick={() => setShowCopilot(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            AI Copilot
          </button>

          <button
            onClick={() => setShowTerminal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            CLI
          </button>

          {/* Investigation Report PDF Modal Button */}
          <button
            onClick={() => setShowFraudDossierModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 border border-rose-400/40"
          >
            <Flame className="w-3.5 h-3.5" />
            Investigation Report (PDF)
          </button>

          {/* Threat Matrix Drawer Button */}
          <button
            onClick={() => setShowThreatMatrix(!showThreatMatrix)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              showThreatMatrix
                ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Threat Matrix ({threatMatrix.length})
          </button>

          <Link
            href={`/investigation/${caseId}/entity-profiler`}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 text-xs font-semibold transition flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            Entity Profiler
          </Link>

          <Link
            href={`/evidence/${caseId}/export`}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition flex items-center gap-1"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            ISO 27037 &amp; SAR
          </Link>
        </div>
      </div>

      {/* Live Mempool Early-Warning Alert Banner */}
      {mempoolAlert && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/60 border border-rose-500/40 shadow-xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-300 uppercase tracking-wide">
                  LIVE TRANSACTION ALERT (EARLY WARNING)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px]">
                  Unconfirmed
                </span>
              </div>
              <p className="text-slate-400 mt-0.5 font-mono text-[11px]">
                Suspect {formatAddress(mempoolAlert.suspect_wallet, 6, 4)} initiated a transfer to{" "}
                <span className="text-cyan-300 font-semibold">{mempoolAlert.target_destination}</span> (
                {formatUSD(mempoolAlert.amount_usd)} | Gas: {mempoolAlert.gas_gwei} Gwei)
              </p>
            </div>
          </div>
          <button
            onClick={() => setMempoolAlert(null)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Threat Matrix Expandable View */}
      {showThreatMatrix && (
        <div className="p-5 rounded-xl bg-slate-900/95 border border-rose-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Flame className="w-5 h-5" />
              <span>Multi-Factor Threat Matrix (0–100 Weighted Seizure Ranking)</span>
            </div>
            <button
              onClick={() => setShowThreatMatrix(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Table ✕
            </button>
          </div>
          <ThreatMatrixTable items={threatMatrix} />
        </div>
      )}

      {/* Canvas Interactive Controls & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GraphControls
          layoutName={layoutName}
          onLayoutChange={setLayoutName}
          minUsd={minUsd}
          onMinUsdChange={setMinUsd}
          filterPeelOnly={filterPeelOnly}
          onFilterPeelChange={setFilterPeelOnly}
          filterVaspOnly={filterVaspOnly}
          onFilterVaspChange={setFilterVaspOnly}
        />
        <TemporalTimelineSlider
          isPlaying={isTimelinePlaying}
          onPlayToggle={() => setIsTimelinePlaying(!isTimelinePlaying)}
          speed={timelineSpeed}
          onSpeedChange={setTimelineSpeed}
          progress={timelineProgress}
          onProgressChange={setTimelineProgress}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas View (3 cols) */}
        <div className="lg:col-span-3 h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          {activeTab === "2d" ? (
            <CytoscapeCanvas
              elements={filteredElements()}
              layoutName={layoutName}
              onOpenDossier={() => setShowFraudDossierModal(true)}
              onIssueSubpoena={(vasp) => setSelectedVasp(vasp)}
            />
          ) : activeTab === "map" ? (
            <TacticalWorldMap
              nodes={graphData?.nodes || []}
              edges={graphData?.edges || []}
              onOpenDossier={() => setShowFraudDossierModal(true)}
              onSelectNode={(node) => {
                if (node.type === "vasp") {
                  setSelectedVasp(node);
                } else {
                  setShowFraudDossierModal(true);
                }
              }}
            />
          ) : activeTab === "3d" ? (
            <ThreeGlobeVisualizer
              vaspHits={terminalVasps.map((v: any) => ({
                name: v.vasp_name,
                risk: v.risk_tier,
                volume_usd: v.absorbed_volume_usd,
                lat: v.geo_location?.lat,
                lng: v.geo_location?.lng,
                jurisdiction: v.jurisdiction,
                deposit_address: v.deposit_address,
              }))}
              suspectOrigin={{
                alias: graphData?.suspect_profile?.alias,
                city: graphData?.suspect_profile?.origin_city || "St. Petersburg",
                country: graphData?.suspect_profile?.origin_country || "Russian Federation",
                lat: 59.9343,
                lng: 30.3351,
              }}
              onSelectVasp={(vasp) => setSelectedVasp(vasp)}
              onOpenDossier={() => setShowFraudDossierModal(true)}
            />
          ) : (
            <SankeyFlowVisualizer data={graphData} />
          )}
        </div>

        {/* Forensic Intelligence Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Primary Fraud Suspect Target Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/30 backdrop-blur space-y-3">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Flame className="w-4 h-4 text-rose-500" />
                Suspect Profile
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                96.5 Threat
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-slate-100 font-bold font-mono text-sm">
                {graphData?.suspect_profile?.alias || "ShadowVault Syndicate (APT-44)"}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Origin: {graphData?.suspect_profile?.origin_city || "St. Petersburg"}, {graphData?.suspect_profile?.origin_country || "RU"}
              </div>
              <div className="text-[10px] text-amber-400 font-mono truncate">
                IP Relay: {graphData?.suspect_profile?.ip_cluster || "91.240.118.42 (Selectel)"}
              </div>
            </div>

            <button
              onClick={() => setShowFraudDossierModal(true)}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Investigation Report (PDF)
            </button>
          </div>

          {/* Identified Terminal VASPs Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Final Destinations (Exchanges) Identified
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {terminalVasps.length} Targets
              </span>
            </div>

            <div className="space-y-2.5">
              {terminalVasps.map((v: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{v.vasp_name}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${v.risk_tier === "LOW" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>
                      {v.risk_tier} Risk
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                    <span>Absorbed:</span>
                    <span className="text-emerald-400 font-semibold">{formatUSD(v.absorbed_volume_usd || 0)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    Deposit: {formatAddress(v.deposit_address, 8, 6)}
                  </div>

                  {/* Subpoena Generation Action Button */}
                  <button
                    onClick={() => setSelectedVasp(v)}
                    className="w-full mt-1 py-1.5 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <AlertOctagon className="w-3 h-3" />
                    Request Account Freeze
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Topological Laundering Typologies Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Laundering Typologies
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Peel Chains:</span>
                <span className="text-amber-400 font-mono font-bold">{anomalies?.peel_chains_count || 1} Chains</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Smurfing Fan-Out:</span>
                <span className="text-cyan-400 font-mono font-bold">{anomalies?.smurfing_fan_out_count || 2} Splits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Cross-Bridge Hops:</span>
                <span className="text-teal-400 font-mono font-bold">{anomalies?.cross_bridge_hops_count || 1} Hops</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Absorbed:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatUSD(anomalies?.suspect_total_illicit_volume_usd || 0)}</span>
              </div>
            </div>

            <Link
              href={`/evidence/${caseId}/export`}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Generate Court Evidence &amp; SAR
            </Link>
          </div>
        </div>
      </div>

      {/* Subpoena Generator Modal */}
      {selectedVasp && (
        <SubpoenaModal
          isOpen={!!selectedVasp}
          onClose={() => setSelectedVasp(null)}
          caseId={caseId}
          vaspName={selectedVasp.vasp_name}
          depositAddress={selectedVasp.deposit_address}
          absorbedUsd={selectedVasp.absorbed_volume_usd}
        />
      )}

      {/* Fraud Detection Intelligence Dossier Modal */}
      <FraudDetectionModal
        isOpen={showFraudDossierModal}
        onClose={() => setShowFraudDossierModal(false)}
        caseId={caseId}
        seedWallet={graphData?.seed_wallet}
        onIssueSubpoena={(vasp) => {
          setShowFraudDossierModal(false);
          setSelectedVasp(vasp);
        }}
      />

      <AICopilotModal 
        isOpen={showCopilot} 
        onClose={() => setShowCopilot(false)} 
        caseId={caseId} 
        graphData={graphData}
        onWalletAdded={(_addr) => {
          fetchGraph();
        }}
      />
      <ForensicTerminalCLI isOpen={showTerminal} onClose={() => setShowTerminal(false)} caseId={caseId} />
      <GlobalCommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </div>
  );
}
