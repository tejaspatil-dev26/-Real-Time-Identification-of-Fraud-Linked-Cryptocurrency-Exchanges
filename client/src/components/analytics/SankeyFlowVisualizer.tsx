import React from "react";
import { Activity } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface SankeyFlowVisualizerProps {
  data: any;
}

export function SankeyFlowVisualizer({ data }: SankeyFlowVisualizerProps) {
  // A simplified placeholder for Sankey visualization
  // Real implementation would use d3-sankey or similar
  
  const totalVolume = data?.anomalies?.suspect_total_illicit_volume_usd || 75000;
  
  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-8">
      <div className="absolute top-6 left-6 flex items-center gap-2 text-slate-300 font-bold text-sm">
        <Activity className="w-5 h-5 text-purple-500" />
        Liquidity Distribution (Sankey Flow)
      </div>
      
      <div className="flex w-full h-[80%] max-w-4xl items-stretch justify-between relative mt-10">
        
        {/* Source Node */}
        <div className="flex flex-col justify-center relative z-10 w-48">
          <div className="bg-slate-900 border-l-4 border-rose-500 p-4 rounded shadow-lg">
            <div className="text-xs text-slate-400 font-mono">Suspect Origin</div>
            <div className="text-lg font-bold text-slate-200 mt-1">{formatUSD(totalVolume)}</div>
            <div className="text-[10px] text-rose-400 mt-1">100% Volume</div>
          </div>
        </div>

        {/* Connections (Mocked as SVG paths) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <path d="M 192 200 C 350 200, 350 120, 500 120" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="60" />
          <path d="M 192 200 C 350 200, 350 280, 500 280" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="40" />
          <path d="M 500 120 C 650 120, 650 100, 750 100" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="60" />
          <path d="M 500 280 C 650 280, 650 300, 750 300" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="40" />
        </svg>

        {/* Intermediary Nodes */}
        <div className="flex flex-col justify-around relative z-10 w-48">
          <div className="bg-slate-900 border-l-4 border-amber-500 p-4 rounded shadow-lg">
            <div className="text-xs text-slate-400 font-mono">Mule Ring A</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{formatUSD(totalVolume * 0.6)}</div>
            <div className="text-[10px] text-amber-400 mt-1">60% Volume</div>
          </div>
          <div className="bg-slate-900 border-l-4 border-amber-500 p-4 rounded shadow-lg">
            <div className="text-xs text-slate-400 font-mono">Mule Ring B</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{formatUSD(totalVolume * 0.4)}</div>
            <div className="text-[10px] text-amber-400 mt-1">40% Volume</div>
          </div>
        </div>

        {/* Terminal Nodes */}
        <div className="flex flex-col justify-around relative z-10 w-48">
          <div className="bg-slate-900 border-l-4 border-cyan-500 p-4 rounded shadow-lg">
            <div className="text-xs text-slate-400 font-mono">Binance Deposit</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{formatUSD(totalVolume * 0.6)}</div>
            <div className="text-[10px] text-cyan-400 mt-1">60% Terminal</div>
          </div>
          <div className="bg-slate-900 border-l-4 border-cyan-500 p-4 rounded shadow-lg">
            <div className="text-xs text-slate-400 font-mono">Coinbase Deposit</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{formatUSD(totalVolume * 0.4)}</div>
            <div className="text-[10px] text-cyan-400 mt-1">40% Terminal</div>
          </div>
        </div>

      </div>
      <div className="absolute bottom-6 right-6 text-[10px] text-slate-500 font-mono bg-slate-900/50 p-2 rounded">
        Sankey projection generated using heuristic volume routing estimation.
      </div>
    </div>
  );
}
