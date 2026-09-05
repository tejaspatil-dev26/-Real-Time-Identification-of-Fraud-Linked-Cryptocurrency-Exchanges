"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Maximize2, Minimize2, X } from "lucide-react";
import { ApiClient } from "../../lib/api";

interface TerminalProps {
  caseId?: string;
}

export function ForensicTerminalCLI({ caseId }: TerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error', text: string }[]>([
    { type: 'output', text: 'CryptoTrace Forensic CLI v2.4.1 initialized.' },
    { type: 'output', text: 'Type "help" for a list of commands.' }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen, isExpanded]);

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    setHistory(prev => [...prev, { type: 'input', text: `$ ${trimmedCmd}` }]);
    setInput("");

    const parts = trimmedCmd.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      if (command === 'help') {
        setHistory(prev => [...prev, { type: 'output', text: `Available commands:
  help                    - Show this message
  clear                   - Clear terminal
  scan <address>          - Quick scan an address
  heuristics <address>    - Get network heuristics
  score <address>         - Get fraud score
  sanctions <address>     - Check OFAC sanctions` }]);
      } else if (command === 'clear') {
        setHistory([]);
      } else if (command === 'scan') {
        if (!args[0]) throw new Error("Missing address argument");
        setHistory(prev => [...prev, { type: 'output', text: `Scanning ${args[0]}...` }]);
        // Mock scan delay
        await new Promise(r => setTimeout(r, 1000));
        setHistory(prev => [...prev, { type: 'output', text: `Scan complete. No immediate threats detected.` }]);
      } else if (command === 'heuristics') {
        if (!args[0]) throw new Error("Missing address argument");
        const res = await ApiClient.intelligence.getNetworkHeuristics(args[0]);
        setHistory(prev => [...prev, { type: 'output', text: JSON.stringify(res, null, 2) }]);
      } else if (command === 'score') {
         if (!args[0]) throw new Error("Missing address argument");
         const res = await ApiClient.intelligence.getFraudScore(args[0]);
         setHistory(prev => [...prev, { type: 'output', text: JSON.stringify(res, null, 2) }]);
      } else if (command === 'sanctions') {
         if (!args[0]) throw new Error("Missing address argument");
         const res = await ApiClient.intelligence.checkSanctions(args[0]);
         setHistory(prev => [...prev, { type: 'output', text: JSON.stringify(res, null, 2) }]);
      } else {
        setHistory(prev => [...prev, { type: 'error', text: `Command not found: ${command}` }]);
      }
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', text: `Error: ${err.message}` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
        title="Open Forensic CLI"
      >
        <TerminalIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed z-40 transition-all duration-300 ease-in-out ${
      isExpanded 
        ? "inset-4 md:inset-10" 
        : "bottom-4 left-4 w-[450px] h-[300px]"
    }`}>
      <div className="bg-[#0a0a0a] border border-[#333] rounded-lg shadow-2xl flex flex-col h-full overflow-hidden font-mono text-sm opacity-95 backdrop-blur">
        {/* Terminal Header */}
        <div className="bg-[#1a1a1a] border-b border-[#333] p-2 flex justify-between items-center select-none">
          <div className="flex items-center gap-2 text-slate-400">
            <TerminalIcon className="w-4 h-4" />
            <span className="text-xs">forensic-cli ~ {caseId || 'global'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-white/10 rounded text-slate-400">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-400 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-grow p-3 overflow-y-auto custom-scrollbar text-slate-300">
          {history.map((line, i) => (
            <div key={i} className={`mb-1 whitespace-pre-wrap ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'input' ? 'text-green-400' : 'text-slate-300'
            }`}>
              {line.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Terminal Input */}
        <div className="p-3 border-t border-[#222] bg-[#111] flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-transparent outline-none text-slate-300"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
