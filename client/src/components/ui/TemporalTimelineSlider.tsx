"use client";

import React, { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react";

interface TemporalTimelineSliderProps {
  startDate: string;
  endDate: string;
  onTimeChange: (currentDate: string) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

export function TemporalTimelineSlider({ 
  startDate, 
  endDate, 
  onTimeChange,
  isPlaying = false,
  onPlayToggle
}: TemporalTimelineSliderProps) {
  const [progress, setProgress] = useState(100); // 0 to 100

  // Helper to interpolate dates
  const calculateCurrentDate = (prog: number) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = start + ((end - start) * (prog / 100));
    return new Date(current).toISOString().split('T')[0];
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    onTimeChange(calculateCurrentDate(newProgress));
  };

  return (
    <div className="bg-[#05110a]/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 w-full max-w-3xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Temporal Reconstruction (Section 9.4)</span>
        </div>
        <div className="text-sm font-mono text-emerald-300 bg-black/60 px-3 py-1 rounded-md border border-emerald-500/30">
          {calculateCurrentDate(progress)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-emerald-400">
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button 
          onClick={onPlayToggle}
          className="p-3 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all text-slate-950 font-bold shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        
        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-emerald-400">
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="flex-grow flex items-center gap-3 ml-4">
          <span className="text-xs text-slate-400 font-mono">{startDate.split('T')[0]}</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-xs text-slate-400 font-mono">{endDate.split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
