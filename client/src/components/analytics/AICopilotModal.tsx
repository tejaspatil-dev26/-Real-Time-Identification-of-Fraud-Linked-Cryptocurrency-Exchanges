"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Zap,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Activity
} from "lucide-react";
import { formatAddress, formatUSD } from "@/lib/utils";

// API key provided via environment variable or user configuration modal
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Resilient model priority list (tested & verified for this key)
const CANDIDATE_MODELS = [
  "gemini-live-2.5-flash-native-audio",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  graphData?: any;
  onWalletAdded?: (address: string) => void;
}

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  highlightNodes?: string[];
  isError?: boolean;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64To16BitPCM(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export function AICopilotModal({ isOpen, onClose, caseId, graphData, onWalletAdded }: AICopilotModalProps) {
  // Mode Selection: "voice" (Gemini Live) vs "chat" (Text REST)
  const [copilotMode, setCopilotMode] = useState<"voice" | "chat">("voice");

  // Directly connected API Key
  const [apiKey, setApiKey] = useState<string>(DEFAULT_API_KEY);
  const [activeModel, setActiveModel] = useState<string>("gemini-live-2.5-flash-native-audio");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Live State
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>("Ready to Connect");
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [actionToast, setActionToast] = useState<{ tool: string; message: string; address?: string } | null>(null);

  // Web Audio Context Refs (16kHz Capture & 24kHz Playback)
  const captureAudioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const [suggestions] = useState<string[]>([
    "Add wallet number 0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be to the watchlist",
    "Explain the peel chain mechanics in this graph",
    "Calculate threat matrix and GNN risk scores",
    "Generate 18 U.S.C. § 981 asset freeze subpoena for Binance"
  ]);

  // Load Saved API Key or fallback to DEFAULT_API_KEY
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("crypto_trace_gemini_api_key");
      const keyToUse = (savedKey && savedKey.trim().length > 10) ? savedKey : DEFAULT_API_KEY;
      
      setApiKey(keyToUse);
      setIsConfigured(true);
      setShowConfig(false);

      if (!savedKey) {
        localStorage.setItem("crypto_trace_gemini_api_key", DEFAULT_API_KEY);
      }
    }
  }, [isOpen]);

  // Initial welcome message once opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          content: `**CryptoTrace AI Copilot Online (Gemini Live)**\n\nDirectly connected with live graph intelligence for **Case #${caseId.substring(0, 8)}**.\n\n🎙️ **Voice Mode Enabled**: Speak naturally to query typologies, or issue real-time commands like *"Add wallet number 0x... to the watchlist"*!`
        }
      ]);
    }
  }, [isOpen, caseId, messages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, liveTranscript]);

  // Stop voice session on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
  }, [isOpen]);

  // Barge-In: cancel active audio playback
  const handleBargeIn = () => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (_) {}
    });
    activeSourcesRef.current = [];
    if (playbackAudioContextRef.current) {
      nextPlayTimeRef.current = playbackAudioContextRef.current.currentTime;
    }
    setIsAiSpeaking(false);
  };

  // Play 24kHz PCM Audio Chunk from Gemini
  const play24kAudioChunk = (base64Data: string) => {
    try {
      if (!playbackAudioContextRef.current) {
        playbackAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = playbackAudioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const pcmFloat32 = base64To16BitPCM(base64Data);
      if (pcmFloat32.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, pcmFloat32.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      channelData.set(pcmFloat32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startAt = Math.max(now, nextPlayTimeRef.current);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setIsAiSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsAiSpeaking(false);
        }
      };
    } catch (err) {
      console.error("[VOICE_PLAYBACK] Error playing 24kHz chunk:", err);
    }
  };

  // Start Voice Session (Microphone + WSS Bridge)
  const startVoiceSession = async () => {
    try {
      setVoiceStatus("Connecting WSS Bridge...");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const wsUrl = `${protocol}//${host}:8000/api/v1/copilot/ws/live/${caseId}?apiKey=${encodeURIComponent(apiKey || DEFAULT_API_KEY)}`;

      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = async () => {
        setVoiceStatus("WSS Connected. Requesting Microphone...");
        setIsVoiceConnected(true);

        try {
          // 1. Playback Context: 24 kHz
          if (!playbackAudioContextRef.current) {
            playbackAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          if (playbackAudioContextRef.current.state === "suspended") {
            await playbackAudioContextRef.current.resume();
          }

          // 2. Capture Context: 16 kHz
          const captureCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          captureAudioContextRef.current = captureCtx;
          if (captureCtx.state === "suspended") {
            await captureCtx.resume();
          }

          // 3. Microphone Audio Stream
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = stream;

          const sourceNode = captureCtx.createMediaStreamSource(stream);
          const processor = captureCtx.createScriptProcessor(2048, 1, 1);
          scriptProcessorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);

            // Compute audio amplitude
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += Math.abs(inputData[i]);
            }
            const avg = sum / inputData.length;
            setUserAudioLevel(Math.min(100, Math.round(avg * 400)));

            // User Barge-In: speaking while Gemini is talking interrupts playback immediately
            if (avg > 0.05 && activeSourcesRef.current.length > 0) {
              handleBargeIn();
            }

            // Convert Float32 to 16-bit PCM little-endian
            const pcmBuffer = floatTo16BitPCM(inputData);
            const base64Audio = arrayBufferToBase64(pcmBuffer);

            ws.send(JSON.stringify({
              type: "realtime_input",
              data: base64Audio
            }));
          };

          sourceNode.connect(processor);
          processor.connect(captureCtx.destination);

          setIsMicActive(true);
          setVoiceStatus("Listening (16kHz PCM)...");
        } catch (mediaErr: any) {
          console.error("Microphone Access Error:", mediaErr);
          setVoiceStatus(`Mic Error: ${mediaErr.message || "Permission Denied"}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "session_ready") {
            setVoiceStatus(`Gemini Live Ready (${msg.sample_rate_in / 1000}k In / ${msg.sample_rate_out / 1000}k Out)`);
          } else if (msg.type === "audio") {
            play24kAudioChunk(msg.data);
            setVoiceStatus("Gemini Speaking (24kHz PCM)");
          } else if (msg.type === "interrupted") {
            handleBargeIn();
            setVoiceStatus("Investigator Interrupted");
          } else if (msg.type === "transcript") {
            setLiveTranscript(msg.text);
            setMessages(prev => [...prev, { role: "bot", content: msg.text }]);
          } else if (msg.type === "tool_executed") {
            const tool = msg.tool;
            const res = msg.result || {};
            const desc = res.message || `Action ${tool} completed`;
            const addr = res.address || msg.args?.address;

            setActionToast({
              tool: tool,
              message: desc,
              address: addr
            });

            // Trigger workspace graph update
            if (addr && onWalletAdded) {
              onWalletAdded(addr);
            }

            setMessages(prev => [
              ...prev,
              {
                role: "bot",
                content: `⚡ **Live Tool Executed:** \`${tool}\`\n\n${desc}${addr ? `\n- **Target Address:** \`${addr}\`` : ""}`
              }
            ]);

            setTimeout(() => setActionToast(null), 6000);
          }
        } catch (err) {
          console.error("Error processing WS message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Gemini Live WS Error:", err);
        setVoiceStatus("WSS Bridge Notice. Ready.");
      };

      ws.onclose = () => {
        setIsVoiceConnected(false);
        setIsMicActive(false);
        setVoiceStatus("Voice Session Disconnected");
      };

    } catch (err: any) {
      console.error("Failed to start voice session:", err);
      setVoiceStatus(`Connection Error: ${err.message}`);
    }
  };

  const stopVoiceSession = () => {
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch (_) {}
      scriptProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (captureAudioContextRef.current) {
      try { captureAudioContextRef.current.close(); } catch (_) {}
      captureAudioContextRef.current = null;
    }
    handleBargeIn();
    if (playbackAudioContextRef.current) {
      try { playbackAudioContextRef.current.close(); } catch (_) {}
      playbackAudioContextRef.current = null;
    }
    if (liveWsRef.current) {
      try { liveWsRef.current.close(); } catch (_) {}
      liveWsRef.current = null;
    }
    setIsVoiceConnected(false);
    setIsMicActive(false);
    setVoiceStatus("Ready to Connect");
    setUserAudioLevel(0);
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKey.trim()) return;

    const trimmedKey = apiKey.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("crypto_trace_gemini_api_key", trimmedKey);
    }

    setIsConfigured(true);
    setShowConfig(false);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2500);

    // If voice session is active, reconnect with new key
    if (isVoiceConnected) {
      stopVoiceSession();
      setTimeout(startVoiceSession, 500);
    }
  };

  const handleClearKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("crypto_trace_gemini_api_key");
    }
    setApiKey("");
    setIsConfigured(false);
    setShowConfig(true);
  };

  // Build Contextual Prompt for Text fallback
  const buildSystemPrompt = () => {
    const nodes = graphData?.nodes || [];
    const edges = graphData?.edges || [];
    const anomalies = graphData?.anomalies || {};
    const seed = graphData?.seed_wallet || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

    const nodesList = nodes.map((n: any) => {
      const d = n.data || n;
      const geo = d.geo_location || {};
      return `- Wallet: ${d.id} | Role: ${d.label || (d.is_seed ? "Suspect Seed" : "Hop")} | Balance: ${d.balance ?? 0} ETH | Risk: ${d.threat_score || d.risk_score || "N/A"} | Location: ${geo.city || "N/A"}, ${geo.country_code || "N/A"}`;
    }).join("\n");

    const edgesList = edges.map((e: any) => {
      const d = e.data || e;
      return `- Transfer: ${d.source} ➔ ${d.target} | Amount: ${d.amount} ${d.token || "ETH"} ($${d.amount_usd || 0}) | Type: ${d.is_peel_chain ? "Peel-Chain" : (d.is_bridge_hop ? "Bridge Hop" : "Standard Transfer")}`;
    }).join("\n");

    return `
You are CryptoTrace AI Copilot, an expert blockchain forensics investigator (ISO/IEC 27037 compliant).
Case ID: ${caseId} | Seed: ${seed}
Detected Typologies: Peel chains (${anomalies?.peel_chains_count || 1}), Smurfing (${anomalies?.smurfing_fan_out_count || 2}), Cross-Bridge Hops (${anomalies?.cross_bridge_hops_count || 1})

WALLETS:
${nodesList || "None"}

TRANSACTIONS:
${edgesList || "None"}
`.trim();
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    // In Voice Mode with active WSS, send text to live stream
    if (copilotMode === "voice" && liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      liveWsRef.current.send(JSON.stringify({ type: "client_text", text }));
      setMessages(prev => [...prev, { role: "user", content: text }]);
      setInputValue("");
      return;
    }

    const keyToUse = apiKey.trim() || DEFAULT_API_KEY;
    const userMessage = text.trim();
    setInputValue("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${keyToUse}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${buildSystemPrompt()}\n\nInvestigator Inquiry: ${userMessage}` }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setMessages(prev => [
          ...prev, 
          { 
            role: "bot", 
            content: data.candidates[0].content.parts[0].text
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "bot",
            content: `❌ ${data?.error?.message || "Error generating response from AI Copilot."}`,
            isError: true
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { 
          role: "bot", 
          content: `❌ **Connection Error:** ${err.message || "Network request failed."}`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-950/50 backdrop-blur-sm pr-4 sm:pr-6">
      <div className="w-[440px] sm:w-[500px] h-[680px] bg-slate-950/98 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200 backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border transition ${
              isAiSpeaking 
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/30 animate-pulse" 
                : isMicActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20"
                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
            }`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100 font-mono tracking-wide">AI COPILOT</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                  GEMINI LIVE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${isVoiceConnected ? "bg-emerald-400 animate-ping" : "bg-cyan-400"}`} />
                  {isVoiceConnected ? "Live WSS Active (16k/24k)" : "Gemini 2.5 Live Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mode Switcher */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setCopilotMode("voice")}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  copilotMode === "voice" 
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>Voice</span>
              </button>
              <button
                onClick={() => setCopilotMode("chat")}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  copilotMode === "chat" 
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Text</span>
              </button>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              title="Configure API Key"
              className={`p-1.5 rounded-lg transition text-xs font-mono flex items-center gap-1 ${
                showConfig 
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Close AI Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toast / Tool Notification */}
        {actionToast && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 font-mono text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[11px] text-emerald-300 flex items-center gap-1">
                <span>⚡ Real-Time Tool Triggered:</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 border border-emerald-500/40 text-[10px]">
                  {actionToast.tool}
                </span>
              </div>
              <div className="text-[10px] text-emerald-100/90 truncate">{actionToast.message}</div>
            </div>
          </div>
        )}

        {/* Collapsible Direct API Key Setup Panel */}
        {showConfig && (
          <div className="p-4 border-b border-cyan-500/30 bg-slate-900/95 space-y-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-xs">
                <Key className="w-4 h-4" />
                <span>Gemini API Key</span>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 font-mono"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-2.5">
              <div className="relative flex items-center">
                <input
                  type={showKeyPassword ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AQ... or AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyPassword(!showKeyPassword)}
                  className="absolute right-2 text-slate-400 hover:text-slate-200"
                >
                  {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!apiKey.trim()}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update &amp; Connect Key</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VOICE LIVE INTERACTIVE PANEL */}
        {copilotMode === "voice" && (
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-col items-center justify-center space-y-3">
            {/* Glowing Voice Orb Visualizer */}
            <div className="relative flex items-center justify-center w-28 h-28 my-1">
              {/* Outer pulsing ring for AI speaking */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isAiSpeaking 
                    ? "bg-purple-500/20 border border-purple-500/60 scale-125 animate-ping" 
                    : isMicActive
                    ? "bg-cyan-500/15 border border-cyan-500/40 animate-pulse"
                    : "border border-slate-800"
                }`} 
              />
              {/* Middle dynamic ring scaled by user voice volume */}
              <div 
                style={{ transform: `scale(${1 + userAudioLevel / 100 * 0.4})` }}
                className={`absolute w-20 h-20 rounded-full transition-transform duration-75 border ${
                  isAiSpeaking
                    ? "border-purple-400/80 bg-purple-950/60 shadow-lg shadow-purple-500/40"
                    : isMicActive
                    ? "border-cyan-400/80 bg-cyan-950/60 shadow-lg shadow-cyan-500/30"
                    : "border-slate-700 bg-slate-900"
                }`}
              />
              {/* Center Core Button */}
              <button
                onClick={isVoiceConnected ? stopVoiceSession : startVoiceSession}
                className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                  isVoiceConnected
                    ? isMicActive
                      ? "bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 hover:scale-105"
                      : "bg-amber-500 text-slate-950"
                    : "bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200"
                }`}
                title={isVoiceConnected ? "Disconnect Voice Assistant" : "Connect Live Voice Assistant"}
              >
                {isVoiceConnected ? (
                  isAiSpeaking ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6 animate-pulse" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Voice Status & Technical Specs */}
            <div className="text-center space-y-1">
              <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isVoiceConnected ? (isAiSpeaking ? "bg-purple-400 animate-pulse" : "bg-emerald-400 animate-ping") : "bg-slate-500"}`} />
                <span>{voiceStatus}</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-center gap-2">
                <span>Mic: 16kHz PCM (Int16)</span>
                <span>•</span>
                <span>Speaker: 24kHz PCM</span>
                <span>•</span>
                <span className="text-cyan-400">Barge-In Active</span>
              </div>
            </div>

            {/* Voice Connect/Disconnect Quick Trigger */}
            <div className="flex items-center gap-2">
              {!isVoiceConnected ? (
                <button
                  onClick={startVoiceSession}
                  className="py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Live Voice Assistant</span>
                </button>
              ) : (
                <button
                  onClick={stopVoiceSession}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-rose-300 font-mono text-xs transition flex items-center gap-1"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop Voice Session</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat / Transcript Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "bot" && (
                <div className="p-1.5 rounded-xl h-fit bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-mono leading-relaxed shadow-md ${
                msg.role === "user"
                  ? "bg-cyan-600 text-slate-950 font-semibold rounded-br-none ml-6"
                  : msg.isError
                  ? "bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-bl-none"
                  : "bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-bl-none"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {msg.role === "user" && (
                <div className="p-1.5 rounded-xl h-fit bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="p-1.5 rounded-xl h-fit bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Bot className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-mono text-[11px] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Evaluating graph intelligence with Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Pills */}
        {suggestions.length > 0 && messages.length <= 3 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-800 transition text-left"
              >
                🗣️ "{s}"
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Form */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={copilotMode === "voice" ? "Speak into mic or type a command here..." : "Ask Copilot anything about this graph..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/20"
              title="Send Command"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
