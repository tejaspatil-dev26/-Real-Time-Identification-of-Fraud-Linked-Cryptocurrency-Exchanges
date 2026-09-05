import json
import logging
import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import websockets
from app.core.config import settings
from app.services.copilot_service import CopilotToolExecutor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["AI Copilot Live"])

GEMINI_LIVE_MODELS = [
    "models/gemini-2.0-flash-exp",
    "gemini-live-2.5-flash-native-audio",
    "models/gemini-2.0-flash-realtime-exp"
]

def build_gemini_setup_message(case_id: str, model_name: str = "models/gemini-2.0-flash-exp") -> dict:
    """
    Constructs the initial BidiGenerateContentSetup message with tool declarations
    and audio configuration (16kHz in, 24kHz out PCM).
    """
    return {
        "setup": {
            "model": model_name,
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": "Puck"
                        }
                    }
                }
            },
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            f"You are CryptoTrace Voice Copilot, an elite cryptocurrency forensic investigator "
                            f"operating under ISO/IEC 27037 digital evidence standards. You are assisting an investigator on Case ID: {case_id}.\n"
                            f"You have direct real-time access to blockchain graph tools:\n"
                            f"1. add_wallet_number: Adds a crypto wallet address to the case watchlist, relational database, and live mempool monitor.\n"
                            f"2. extract_peel_chain: Analyzes peeling transactions and hops from a seed wallet.\n"
                            f"3. calculate_threat_matrix: Re-computes GNN risk rankings for the graph.\n"
                            f"4. generate_freeze_subpoena: Prepares a statutory 18 U.S.C. § 981 asset freeze order for a VASP.\n\n"
                            f"If the investigator says 'Add wallet number 0x...' or requests an action, call the corresponding tool immediately. "
                            f"When the tool returns, verbally confirm what action was taken concisely."
                        )
                    }
                ]
            },
            "tools": [
                {
                    "functionDeclarations": [
                        {
                            "name": "add_wallet_number",
                            "description": "Adds a suspect cryptocurrency wallet address to the case watchlist, database, and mempool monitor.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "address": {
                                        "type": "STRING",
                                        "description": "The crypto wallet address (e.g. 0x742d35Cc6634C0532925a3b844Bc454e4438f44e)"
                                    },
                                    "label": {
                                        "type": "STRING",
                                        "description": "Optional label or description for the suspect wallet"
                                    }
                                },
                                "required": ["address"]
                            }
                        },
                        {
                            "name": "extract_peel_chain",
                            "description": "Extracts peel chain laundering patterns and hop sequences originating from a seed wallet.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "seed_wallet": {
                                        "type": "STRING",
                                        "description": "The seed or suspect wallet address to trace"
                                    }
                                },
                                "required": ["seed_wallet"]
                            }
                        },
                        {
                            "name": "calculate_threat_matrix",
                            "description": "Calculates inductive GNN risk scores and threat ranking matrix for the current case.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "case_id": {
                                        "type": "STRING",
                                        "description": "The investigation case ID"
                                    }
                                }
                            }
                        },
                        {
                            "name": "generate_freeze_subpoena",
                            "description": "Generates a legally binding 18 U.S.C. § 981 emergency asset freeze subpoena dossier for a target VASP.",
                            "parameters": {
                                "type": "OBJECT",
                                "properties": {
                                    "vasp_name": {
                                        "type": "STRING",
                                        "description": "Target exchange (e.g. 'Binance', 'Coinbase', 'Kraken')"
                                    },
                                    "deposit_address": {
                                        "type": "STRING",
                                        "description": "Optional illicit deposit address"
                                    }
                                },
                                "required": ["vasp_name"]
                            }
                        }
                    ]
                }
            ]
        }
    }


async def execute_tool_call(name: str, args: dict, case_id: str) -> dict:
    """Routes function calling requests to CopilotToolExecutor."""
    try:
        if name == "add_wallet_number":
            address = args.get("address", "")
            label = args.get("label")
            return await CopilotToolExecutor.add_wallet_number(case_id, address, label)
        elif name == "extract_peel_chain":
            seed_wallet = args.get("seed_wallet", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e")
            return await CopilotToolExecutor.extract_peel_chain(case_id, seed_wallet)
        elif name == "calculate_threat_matrix":
            target_case = args.get("case_id", case_id)
            return await CopilotToolExecutor.calculate_threat_matrix(target_case)
        elif name == "generate_freeze_subpoena":
            vasp_name = args.get("vasp_name", "Binance")
            dep_addr = args.get("deposit_address")
            return await CopilotToolExecutor.generate_freeze_subpoena(case_id, vasp_name, dep_addr)
        else:
            return {"status": "UNKNOWN_TOOL", "error": f"Unrecognized tool '{name}'"}
    except Exception as ex:
        logger.error(f"[COPILOT_TOOL] Error executing {name}: {ex}")
        return {"status": "ERROR", "error": str(ex)}


@router.websocket("/ws/live/{case_id}")
async def gemini_live_websocket(
    websocket: WebSocket,
    case_id: str,
    apiKey: Optional[str] = Query(None)
):
    """
    Server-to-Server Gemini Live WebSocket Bridge:
    1. Client connects via WebSocket, sending 16kHz PCM audio chunks.
    2. Backend proxies to Gemini Live API over stateful WSS connection.
    3. Intercepts function calls, executes DB/graph changes, pushes UI events, and returns tool_responses.
    4. Streams 24kHz PCM audio back to the client with barge-in interruption support.
    """
    await websocket.accept()
    logger.info(f"[COPILOT_LIVE] Client connected for Case: {case_id}")

    key_to_use = apiKey or getattr(settings, "GEMINI_API_KEY", "")
    gemini_wss_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={key_to_use}"

    gemini_ws = None
    connected_to_gemini = False

    # Attempt connection to Gemini Live API
    for model in GEMINI_LIVE_MODELS:
        try:
            logger.info(f"[COPILOT_LIVE] Connecting to Gemini Live API ({model})...")
            gemini_ws = await asyncio.wait_for(
                websockets.connect(gemini_wss_url, ping_interval=20, ping_timeout=20),
                timeout=5.0
            )
            # Send initial setup message
            setup_msg = build_gemini_setup_message(case_id, model_name=model)
            await gemini_ws.send(json.dumps(setup_msg))

            # Await setupComplete
            resp_raw = await asyncio.wait_for(gemini_ws.recv(), timeout=5.0)
            resp = json.loads(resp_raw)
            if "setupComplete" in resp or "setup_complete" in resp:
                connected_to_gemini = True
                logger.info(f"[COPILOT_LIVE] Gemini Live session initialized successfully with model {model}!")
                await websocket.send_json({
                    "type": "session_ready",
                    "model": model,
                    "sample_rate_in": 16000,
                    "sample_rate_out": 24000,
                    "status": "LIVE"
                })
                break
            else:
                logger.warning(f"[COPILOT_LIVE] Setup rejected with model {model}: {resp_raw[:200]}")
                await gemini_ws.close()
                gemini_ws = None
        except Exception as ex:
            logger.warning(f"[COPILOT_LIVE] Failed to connect to Gemini with model {model}: {ex}")
            if gemini_ws:
                try:
                    await gemini_ws.close()
                except Exception:
                    pass
                gemini_ws = None

    if not connected_to_gemini:
        logger.warning("[COPILOT_LIVE] Using local resilient forensic simulation mode for Voice Assistant.")
        await websocket.send_json({
            "type": "session_ready",
            "model": "cryptotrace-forensic-voice-engine",
            "sample_rate_in": 16000,
            "sample_rate_out": 24000,
            "status": "SIMULATION_READY",
            "message": "Connected to CryptoTrace Forensic Copilot Engine."
        })

    async def client_to_gemini_task():
        """Reads audio chunks and text from frontend client and forwards to Gemini Live."""
        try:
            while True:
                msg_raw = await websocket.receive_text()
                try:
                    msg = json.loads(msg_raw)
                except Exception:
                    continue

                msg_type = msg.get("type", "")

                if msg_type == "realtime_input":
                    # Raw 16-bit PCM, 16kHz base64 audio
                    pcm_data = msg.get("data", "")
                    if connected_to_gemini and gemini_ws:
                        gemini_frame = {
                            "realtimeInput": {
                                "mediaChunks": [
                                    {
                                        "mimeType": "audio/pcm;rate=16000",
                                        "data": pcm_data
                                    }
                                ]
                            }
                        }
                        await gemini_ws.send(json.dumps(gemini_frame))
                    else:
                        # Simulation mode: handle audio heartbeat
                        pass

                elif msg_type == "client_text" or msg_type == "text":
                    text_content = msg.get("text", "")
                    logger.info(f"[COPILOT_LIVE] Received client text: {text_content}")

                    # Check for direct spoken command patterns in simulation mode
                    if "add wallet" in text_content.lower() or "0x" in text_content:
                        import re
                        m = re.search(r"(0x[a-fA-F0-9]{40})", text_content)
                        if m:
                            addr = m.group(1)
                            res = await execute_tool_call("add_wallet_number", {"address": addr}, case_id)
                            await websocket.send_json({
                                "type": "tool_executed",
                                "tool": "add_wallet_number",
                                "result": res
                            })
                            await websocket.send_json({
                                "type": "transcript",
                                "text": f"Affirmative, Investigator. Wallet {addr} has been registered to Case #{case_id[:8]} and live mempool interception is active."
                            })
                            continue

                    if connected_to_gemini and gemini_ws:
                        gemini_frame = {
                            "clientContent": {
                                "turns": [
                                    {
                                        "role": "user",
                                        "parts": [{"text": text_content}]
                                    }
                                ],
                                "turnComplete": True
                            }
                        }
                        await gemini_ws.send(json.dumps(gemini_frame))

        except WebSocketDisconnect:
            logger.info("[COPILOT_LIVE] Client disconnected.")
        except Exception as ex:
            logger.error(f"[COPILOT_LIVE] Error in client_to_gemini: {ex}")

    async def gemini_to_client_task():
        """Reads 24kHz audio, transcripts, and tool calls from Gemini Live and routes to client."""
        if not (connected_to_gemini and gemini_ws):
            return

        try:
            while True:
                msg_raw = await gemini_ws.recv()
                data = json.loads(msg_raw)

                # 1. Check for barge-in / user interruption
                if "serverContent" in data:
                    server_content = data["serverContent"]
                    if server_content.get("interrupted"):
                        await websocket.send_json({"type": "interrupted"})

                    model_turn = server_content.get("modelTurn", {})
                    for part in model_turn.get("parts", []):
                        # Audio streaming
                        inline_data = part.get("inlineData", {}) or part.get("inline_data", {})
                        mime = inline_data.get("mimeType", "") or inline_data.get("mime_type", "")
                        if "audio/pcm" in mime or "audio" in mime:
                            audio_b64 = inline_data.get("data", "")
                            if audio_b64:
                                await websocket.send_json({
                                    "type": "audio",
                                    "data": audio_b64,
                                    "sample_rate": 24000
                                })

                        # Text transcript
                        if "text" in part:
                            await websocket.send_json({
                                "type": "transcript",
                                "text": part["text"]
                            })

                # 2. Check for Function Calling (Tools)
                if "toolCall" in data or "tool_call" in data:
                    tool_call_obj = data.get("toolCall") or data.get("tool_call")
                    function_calls = tool_call_obj.get("functionCalls") or tool_call_obj.get("function_calls", [])

                    function_responses = []
                    for call in function_calls:
                        call_id = call.get("id", "")
                        func_name = call.get("name", "")
                        func_args = call.get("args", {})

                        logger.info(f"[COPILOT_LIVE] Intercepted Gemini Tool Call: {func_name} with args: {func_args}")

                        # Execute database/graph/service update
                        tool_result = await execute_tool_call(func_name, func_args, case_id)

                        # Push visual update event to frontend UI
                        await websocket.send_json({
                            "type": "tool_executed",
                            "tool": func_name,
                            "args": func_args,
                            "result": tool_result
                        })

                        function_responses.append({
                            "id": call_id,
                            "response": {
                                "output": tool_result
                            }
                        })

                    # Return toolResponse to Gemini Live so it verbally confirms the action
                    gemini_tool_resp = {
                        "toolResponse": {
                            "functionResponses": function_responses
                        }
                    }
                    await gemini_ws.send(json.dumps(gemini_tool_resp))

        except websockets.ConnectionClosed:
            logger.info("[COPILOT_LIVE] Gemini Live connection closed.")
        except Exception as ex:
            logger.error(f"[COPILOT_LIVE] Error in gemini_to_client: {ex}")

    try:
        await asyncio.gather(
            client_to_gemini_task(),
            gemini_to_client_task(),
            return_exceptions=True
        )
    finally:
        if gemini_ws:
            try:
                await gemini_ws.close()
            except Exception:
                pass
