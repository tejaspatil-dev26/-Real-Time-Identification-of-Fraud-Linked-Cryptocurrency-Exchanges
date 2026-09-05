import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from "lucide-react";
import { ApiClient } from "@/lib/api";

interface ForensicTerminalCLIProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

export function ForensicTerminalCLI({ isOpen, onClose, caseId }: ForensicTerminalCLIProps) {
  const [history, setHistory] = useState<{cmd: string, output: string, type: 'success' | 'error' | 'info'}[]>([
    { cmd: "sys", output: "CryptoTrace Forensics Terminal v2.4 initialized. Type 'help' for commands.", type: 'info' }
  ]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen, isExpanded]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setInput("");
    
    let output = "";
    let type: 'success' | 'error' | 'info' = 'success';

    const args = cmd.split(" ");
    const baseCmd = args[0].toLowerCase();

    try {
      if (baseCmd === "help") {
        output = `Available commands:
  trace <address> [--depth N] [--chain NAME] : Trace entity graph
  filter [--min-usd N] [--entity TYPE]       : Apply canvas filters
  sanctions --check-all                      : Screen active graph
  predict --target vasp                      : Run ML off-ramp model
  freeze --vasp NAME                         : Generate freeze order
  export --format pdf                        : Generate ISO27037 report
  clear                                      : Clear terminal`;
      } else if (baseCmd === "clear") {
        setHistory([]);
        return;
      } else if (baseCmd === "sanctions") {
        output = "Executing OFAC SDN screening against 12 extracted entities...\n[WARN] Match found: 0x28C6...1d60 matches Garantex Europe OU\n[WARN] Match found: 0x742d...f44e matches ShadowVault Syndicate";
        type = "error";
      } else if (baseCmd === "predict") {
        output = "Running GraphSAGE Off-Ramp model...\n> 58.4% Probability: Binance (Global)\n> 21.6% Probability: OKX (Seychelles)\nModel confidence: VERY_HIGH";
      } else if (baseCmd === "freeze") {
        output = `Generating 18 U.S.C. § 981 mandate for ${args[2] || "VASP"}...\n[SUCCESS] Mandate generated: MANDATE-${caseId.substring(0,8)}-${(args[2] || "VASP").toUpperCase()}`;
      } else if (baseCmd === "export") {
        output = "Compiling forensic artifacts...\n[SUCCESS] ISO/IEC 27037 Evidence Package generated with SHA-256 seal.";
      } else if (baseCmd === "trace") {
        output = `Tracing topological graph from seed ${args[1] || "unknown"} on ${args.includes("--chain") ? args[args.indexOf("--chain") + 1] : "ETHEREUM"}...\nDiscovered 6 mules, 2 bridges. Subgraph expanded.`;
      } else {
        output = `Command not found: ${baseCmd}. Type 'help' for available commands.`;
        type = "error";
      }
    } catch (err) {
      output = `Execution failed: ${(err as Error).message}`;
      type = "error";
    }

    setHistory(prev => [...prev, { cmd, output, type }]);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-slate-950 border border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
      isExpanded ? "w-full md:w-3/4 h-[50vh] md:right-4 md:bottom-4 md:rounded-t-lg" : "w-full md:w-[500px] h-[300px] md:right-4 md:bottom-4 md:rounded-t-lg"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 cursor-default select-none">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-mono">
          <TerminalIcon className="w-4 h-4 text-cyan-500" />
          <span>Forensic Terminal CLI</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:text-slate-300 transition">
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 hover:text-slate-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed bg-[#0c1017]">
        {history.map((entry, idx) => (
          <div key={idx} className="mb-3">
            {entry.cmd !== "sys" && (
              <div className="text-slate-400">
                <span className="text-emerald-500">agent@ct-core</span>
                <span className="text-slate-500">:</span>
                <span className="text-cyan-500">~/case/{caseId.substring(0,8)}</span>
                <span className="text-slate-300">$ {entry.cmd}</span>
              </div>
            )}
            <div className={`mt-1 whitespace-pre-wrap ${
              entry.type === 'error' ? 'text-rose-400' :
              entry.type === 'info' ? 'text-cyan-300' : 'text-slate-300'
            }`}>
              {entry.output}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleCommand} className="flex items-center p-2 bg-[#0c1017] border-t border-slate-800 font-mono text-[11px]">
        <span className="text-emerald-500 mr-1">agent@ct-core</span>
        <span className="text-slate-500 mr-1">:</span>
        <span className="text-cyan-500 mr-2">~</span>
        <span className="text-slate-400 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-slate-200 focus:outline-none placeholder:text-slate-700"
          placeholder="Type command..."
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
      </form>
    </div>
  );
}
