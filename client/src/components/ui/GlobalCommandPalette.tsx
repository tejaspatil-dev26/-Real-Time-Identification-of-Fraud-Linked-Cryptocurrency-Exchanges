import React, { useState, useEffect } from "react";
import { Search, Terminal, FileText, ArrowRight, X } from "lucide-react";

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalCommandPalette({ isOpen, onClose }: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // If already open, close it. Otherwise this component handles closing via ESC.
        // Actually, opening logic is usually handled by parent, but we can handle ESC here.
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = [
    { type: "case", title: "Case: Binance Smurfing Ring (c1f7a22a...)", icon: FileText },
    { type: "wallet", title: "Wallet: 0x742d...44e (ShadowVault Seed)", icon: Search },
    { type: "action", title: "Run: Predictive Off-Ramp Model", icon: Terminal },
    { type: "action", title: "Generate: ISO 27037 Evidence Package", icon: FileText },
  ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-slate-200 text-lg focus:outline-none placeholder:text-slate-500"
            placeholder="Type a command or search wallets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Results
              </div>
              {results.map((r, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 text-left transition group"
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <r.icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                    <span className="text-sm text-slate-300 group-hover:text-slate-100">{r.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↵</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
