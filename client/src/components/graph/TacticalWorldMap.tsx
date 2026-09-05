"use client";

import React, { useState } from "react";
import { 
  Globe2, 
  ShieldAlert, 
  MapPin, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  AlertTriangle,
  Building2,
  Flame,
  Radio
} from "lucide-react";
import { formatAddress, formatUSD } from "@/lib/utils";

interface GeoNode {
  id: string;
  label?: string;
  type?: string;
  is_seed?: boolean;
  vasp_name?: string;
  vasp_risk?: string;
  threat_score?: number;
  balance?: number;
  hop_depth?: number;
  geo_location?: {
    city: string;
    country: string;
    country_code: string;
    lat: number;
    lng: number;
  };
  ip_cluster?: string;
  threat_actor?: string;
  modus_operandi?: string;
  detection_rationale?: string;
}

interface TacticalWorldMapProps {
  nodes: any[];
  edges: any[];
  onSelectNode?: (nodeData: any) => void;
  onOpenDossier?: () => void;
}

export default function TacticalWorldMap({
  nodes = [],
  edges = [],
  onSelectNode,
  onOpenDossier,
}: TacticalWorldMapProps) {
  const [selectedGeoNode, setSelectedGeoNode] = useState<GeoNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterRiskOnly, setFilterRiskOnly] = useState<boolean>(false);

  // Convert lat/lng to SVG map coordinates (1000 x 500 canvas)
  const projectCoords = (lat: number, lng: number): { x: number; y: number } => {
    // Equirectangular projection
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x: Math.max(20, Math.min(980, x)), y: Math.max(20, Math.min(480, y)) };
  };

  // Extract geocoded nodes
  const geoNodes: GeoNode[] = nodes
    .map((n) => n.data || n)
    .filter((n) => n.geo_location && typeof n.geo_location.lat === "number");

  // Fallback points if graph nodes are missing geo
  const fallbackPoints: GeoNode[] = [
    {
      id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      label: "SUSPECT SEED WALLET",
      type: "wallet",
      is_seed: true,
      threat_score: 96.5,
      geo_location: { city: "St. Petersburg", country: "Russian Federation", country_code: "RU", lat: 59.9343, lng: 30.3351 },
      ip_cluster: "91.240.118.42 (Selectel Cloud)",
      threat_actor: "ShadowVault Syndicate (APT-44)",
      modus_operandi: "Automated Smart Contract Drainer & Multi-Hop Peel Forwarding",
      detection_rationale: "Primary suspect origin identified via initial victim complaint and mempool telemetry."
    },
    {
      id: "0x28C6c06298d514Db089934071355E5743bf21d60",
      label: "Binance Custodial Deposit",
      type: "vasp",
      vasp_name: "Binance",
      vasp_risk: "LOW",
      threat_score: 85.0,
      geo_location: { city: "George Town", country: "Cayman Islands", country_code: "KY", lat: 19.2838, lng: -81.3675 },
      detection_rationale: "Terminal VASP deposit point. Inflow of illicit funds flagged for immediate asset freeze."
    },
    {
      id: "0x503828976D22510aad0201ac7EC88293211A23Dc",
      label: "Coinbase Hot Wallet",
      type: "vasp",
      vasp_name: "Coinbase",
      vasp_risk: "LOW",
      threat_score: 78.0,
      geo_location: { city: "San Francisco", country: "United States", country_code: "US", lat: 37.7749, lng: -122.4194 },
      detection_rationale: "Second terminal cash-out hub absorbing peel-chain outflows."
    },
    {
      id: "0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
      label: "ThorChain Native Router",
      type: "bridge",
      threat_score: 82.0,
      geo_location: { city: "Zurich", country: "Switzerland", country_code: "CH", lat: 47.3769, lng: 8.5417 },
      detection_rationale: "Cross-chain liquidity bridge router facilitating chain-hopping into Bitcoin."
    },
    {
      id: "0x6cC5F688a30d379E122C92463F8B3e1c07E35fE6",
      label: "OKX OTC Desk",
      type: "vasp",
      vasp_name: "OKX",
      vasp_risk: "LOW",
      threat_score: 72.0,
      geo_location: { city: "Victoria", country: "Seychelles", country_code: "SC", lat: -4.6796, lng: 55.4920 },
      detection_rationale: "Offshore OTC liquidation gateway identified in multi-hop traversal."
    }
  ];

  const activePoints = geoNodes.length > 0 ? geoNodes : fallbackPoints;

  // Build connection arcs between seed and other nodes
  const seedNode = activePoints.find((p) => p.is_seed) || activePoints[0];
  const seedCoords = projectCoords(seedNode.geo_location!.lat, seedNode.geo_location!.lng);

  const handleNodeClick = (node: GeoNode) => {
    setSelectedGeoNode(node);
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-[#070b14] rounded-xl border border-slate-800 overflow-hidden shadow-2xl select-none">
      {/* Top Tactical HUD Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur pointer-events-auto">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold tracking-wider">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>TACTICAL GEOSPATIAL INTELLIGENCE RADAR</span>
          </div>
          <span className="h-3 w-[1px] bg-slate-700"></span>
          <span className="text-[11px] text-slate-400 font-mono">
            {activePoints.length} Monitored Points
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setFilterRiskOnly(!filterRiskOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterRiskOnly 
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50" 
                : "bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200"
            }`}
          >
            Critical Targets Only
          </button>
          <button
            onClick={onOpenDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition"
          >
            <Flame className="w-3.5 h-3.5" />
            Download Investigation Report (PDF)
          </button>
        </div>
      </div>

      {/* Interactive Map SVG Canvas */}
      <div 
        className="w-full h-full flex items-center justify-center transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at center, #0c1527 0%, #060913 100%)" }}
        >
          <defs>
            {/* Pulsing beacon animations */}
            <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="arcFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Graticule Grid */}
          <g opacity="0.12" stroke="#38bdf8" strokeWidth="0.5">
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
              <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="500" strokeDasharray="3 3" />
            ))}
            {[100, 200, 300, 400].map((y) => (
              <line key={`y-${y}`} x1="0" y1={y} x2="1000" y2={y} strokeDasharray="3 3" />
            ))}
            {/* Equator & Prime Meridian */}
            <line x1="0" y1="250" x2="1000" y2="250" strokeWidth="1" opacity="0.4" />
            <line x1="500" y1="0" x2="500" y2="500" strokeWidth="1" opacity="0.4" />
          </g>

          {/* Stylized Continents Outlines */}
          <g fill="#0e172a" stroke="#1e293b" strokeWidth="1.2" opacity="0.85">
            {/* North America */}
            <path d="M 120 100 Q 180 80 240 100 L 260 140 Q 280 180 230 220 L 190 230 L 160 180 Z" />
            <path d="M 190 230 Q 210 260 220 300 L 200 310 L 180 260 Z" />
            {/* South America */}
            <path d="M 230 310 Q 290 320 310 380 L 280 460 Q 250 470 230 430 L 220 360 Z" />
            {/* Europe */}
            <path d="M 460 110 Q 520 100 550 140 L 530 180 L 480 190 L 460 150 Z" />
            {/* Africa */}
            <path d="M 470 200 Q 560 210 570 280 L 540 380 Q 510 400 480 370 L 460 270 Z" />
            {/* Asia */}
            <path d="M 550 110 Q 750 80 850 140 L 820 250 Q 720 280 650 250 L 570 190 Z" />
            {/* Australia */}
            <path d="M 760 340 Q 860 330 870 390 L 830 430 Q 770 440 750 390 Z" />
          </g>

          {/* Capital Velocity Flight Arcs (Seed -> Target Nodes) */}
          <g>
            {activePoints.map((target, idx) => {
              if (target.id === seedNode.id) return null;
              const targetCoords = projectCoords(target.geo_location!.lat, target.geo_location!.lng);
              
              // Calculate curved quadratic bezier midpoint with natural curvature
              const midX = (seedCoords.x + targetCoords.x) / 2;
              const midY = Math.min(seedCoords.y, targetCoords.y) - 60;

              return (
                <g key={`arc-${idx}`}>
                  {/* Glowing Track */}
                  <path
                    d={`M ${seedCoords.x} ${seedCoords.y} Q ${midX} ${midY} ${targetCoords.x} ${targetCoords.y}`}
                    fill="none"
                    stroke="url(#arcFlowGrad)"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                    opacity="0.85"
                  />
                  {/* Directional Velocity Indicator Particle */}
                  <circle
                    cx={(seedCoords.x + midX) / 2}
                    cy={(seedCoords.y + midY) / 2}
                    r="2.5"
                    fill="#38bdf8"
                    filter="url(#glowEffect)"
                  />
                </g>
              );
            })}
          </g>

          {/* Geo Markers */}
          <g>
            {activePoints.map((point, idx) => {
              const coords = projectCoords(point.geo_location!.lat, point.geo_location!.lng);
              const isSeed = point.is_seed;
              const isVasp = point.type === "vasp";
              const isBridge = point.type === "bridge";

              return (
                <g
                  key={`node-${idx}`}
                  className="cursor-pointer group"
                  onClick={() => handleNodeClick(point)}
                >
                  {/* Pulsing Outer Rings */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSeed ? 22 : 16}
                    fill={isSeed ? "url(#redGlow)" : (isVasp ? "url(#emeraldGlow)" : "url(#cyanGlow)")}
                    opacity="0.7"
                    className="animate-ping"
                    style={{ animationDuration: isSeed ? "2s" : "3.5s" }}
                  />

                  {/* Node Outer Circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSeed ? 9 : 7}
                    fill={isSeed ? "#e11d48" : (isVasp ? "#059669" : (isBridge ? "#0891b2" : "#1e293b"))}
                    stroke={isSeed ? "#fda4af" : (isVasp ? "#34d399" : "#38bdf8")}
                    strokeWidth="2"
                    filter="url(#glowEffect)"
                  />

                  {/* Inner Center Dot */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="2.5"
                    fill="#ffffff"
                  />

                  {/* Marker Label */}
                  <text
                    x={coords.x}
                    y={coords.y + (isSeed ? 20 : 16)}
                    fill={isSeed ? "#f43f5e" : (isVasp ? "#34d399" : "#cbd5e1")}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow"
                  >
                    {isSeed 
                      ? "SUSPECT SEED" 
                      : (point.vasp_name ? `VASP: ${point.vasp_name}` : point.geo_location?.city)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-lg shadow-xl backdrop-blur z-10">
        <button
          onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
          title="Zoom In"
          className="p-1.5 rounded text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
          title="Zoom Out"
          className="p-1.5 rounded text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          title="Reset View"
          className="p-1.5 rounded text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-lg text-xs backdrop-blur z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-slate-300 font-mono">Suspect Origin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-mono">Terminal VASP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span className="text-slate-300 font-mono">Bridge / Mule Relay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-gradient-to-r from-rose-500 to-emerald-500"></span>
          <span className="text-slate-300 font-mono">Flight Velocity</span>
        </div>
      </div>

      {/* Interactive Node Drawer Popup */}
      {selectedGeoNode && (
        <div className="absolute top-14 right-4 w-84 bg-slate-900/95 border border-slate-700/90 rounded-xl p-4 shadow-2xl backdrop-blur z-20 transition-all animate-in fade-in slide-in-from-right-4 text-xs space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                selectedGeoNode.is_seed 
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                  : (selectedGeoNode.type === "vasp" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30")
              }`}>
                {selectedGeoNode.is_seed ? "Primary Suspect Origin" : (selectedGeoNode.type === "vasp" ? "Terminal VASP Cash-Out" : "Relayer Node")}
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-1 font-mono">
                {selectedGeoNode.vasp_name ? `Exchange: ${selectedGeoNode.vasp_name}` : formatAddress(selectedGeoNode.id, 8, 6)}
              </h4>
            </div>
            <button
              onClick={() => setSelectedGeoNode(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Jurisdiction / City:</span>
              <span className="text-slate-200 font-medium font-mono">
                {selectedGeoNode.geo_location?.city}, {selectedGeoNode.geo_location?.country}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Coordinates:</span>
              <span className="text-cyan-400 font-mono">
                {selectedGeoNode.geo_location?.lat.toFixed(4)}°, {selectedGeoNode.geo_location?.lng.toFixed(4)}°
              </span>
            </div>
            {selectedGeoNode.ip_cluster && (
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Telemetry:</span>
                <span className="text-amber-400 font-mono text-[11px] truncate max-w-[180px]">
                  {selectedGeoNode.ip_cluster}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Threat Index:</span>
              <span className="text-rose-400 font-bold font-mono">
                {selectedGeoNode.threat_score || 85.0} / 100
              </span>
            </div>

            {selectedGeoNode.detection_rationale && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-cyan-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Detection Intelligence Rationale
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedGeoNode.detection_rationale}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onOpenDossier}
            className="w-full py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            Open Fraud Suspect Dossier
          </button>
        </div>
      )}
    </div>
  );
}
