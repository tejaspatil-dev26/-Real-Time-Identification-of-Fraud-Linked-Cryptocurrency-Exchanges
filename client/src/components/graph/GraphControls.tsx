"use client";

import React from "react";
import { Filter, Layers, DollarSign, Cpu } from "lucide-react";

interface GraphControlsProps {
  layoutName: "dagre" | "fcose";
  onLayoutChange: (layout: "dagre" | "fcose") => void;
  minUsd: number;
  onMinUsdChange: (usd: number) => void;
  filterPeelOnly: boolean;
  onFilterPeelChange: (val: boolean) => void;
  filterVaspOnly: boolean;
  onFilterVaspChange: (val: boolean) => void;
}

export function GraphControls({
  layoutName,
  onLayoutChange,
  minUsd,
  onMinUsdChange,
  filterPeelOnly,
  onFilterPeelChange,
  filterVaspOnly,
  onFilterVaspChange,
}: GraphControlsProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
      {/* Left: Layout Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 flex items-center gap-1 font-semibold">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Map Layout:
        </span>
        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          <button
            onClick={() => onLayoutChange("dagre")}
            className={`px-2.5 py-1 rounded-md transition ${
              layoutName === "dagre" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => onLayoutChange("fcose")}
            className={`px-2.5 py-1 rounded-md transition ${
              layoutName === "fcose" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Network Web
          </button>
        </div>
      </div>

      {/* Middle: USD Threshold */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 flex items-center gap-1 font-semibold">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Min USD:
        </span>
        <input
          type="range"
          min="0"
          max="5000"
          step="250"
          value={minUsd}
          onChange={(e) => onMinUsdChange(Number(e.target.value))}
          className="w-28 accent-cyan-400 cursor-pointer"
        />
        <span className="font-mono text-cyan-400 min-w-[50px]">${minUsd}</span>
      </div>

      {/* Right: Anomaly Toggles */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterPeelOnly}
            onChange={(e) => onFilterPeelChange(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-amber-400 font-medium">Peel Chains</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterVaspOnly}
            onChange={(e) => onFilterVaspChange(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-emerald-400 font-medium">VASPs Only</span>
        </label>
      </div>
    </div>
  );
}
