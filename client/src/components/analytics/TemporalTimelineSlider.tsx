import React from "react";
import { Play, Pause, Info } from "lucide-react";
import { motion } from "framer-motion";

interface TemporalTimelineSliderProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  progress: number;
  onProgressChange: (val: number) => void;
}

export function TemporalTimelineSlider({
  isPlaying,
  onPlayToggle,
  speed,
  onSpeedChange,
  progress,
  onProgressChange
}: TemporalTimelineSliderProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur rounded-xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            Timeline Replay
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => onSpeedChange(1)}
            className={`px-2 py-1 rounded transition ${speed === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 border border-transparent'}`}
          >
            1x
          </button>
          <button
            onClick={() => onSpeedChange(2)}
            className={`px-2 py-1 rounded transition ${speed === 2 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 border border-transparent'}`}
          >
            2x
          </button>
          <button
            onClick={() => onSpeedChange(5)}
            className={`px-2 py-1 rounded transition ${speed === 5 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 border border-transparent'}`}
          >
            5x
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onPlayToggle} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex-1 relative flex items-center h-6">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 relative z-10 opacity-0"
          />
          <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800 rounded-lg overflow-hidden pointer-events-none">
             <motion.div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
              style={{ width: `${progress}%` }}
              layout
            />
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 w-12 text-right">
          {progress.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
