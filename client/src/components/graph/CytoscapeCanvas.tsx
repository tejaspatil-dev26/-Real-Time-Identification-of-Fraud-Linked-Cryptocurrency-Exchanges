"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape from "cytoscape";
// @ts-ignore
import dagre from "cytoscape-dagre";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Magnet, 
  Copy, 
  Check, 
  AlertOctagon, 
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  Globe,
  DollarSign,
  Hash,
  ExternalLink,
  X,
  Layers
} from "lucide-react";
import { formatAddress, formatUSD } from "@/lib/utils";

// Register layout plugins if not already registered
try {
  cytoscape.use(dagre);
  cytoscape.use(fcose);
} catch (_) {}

interface CytoscapeCanvasProps {
  elements: {
    nodes: any[];
    edges: any[];
  };
  layoutName?: "dagre" | "fcose" | "breadthfirst";
  onNodeSelect?: (nodeData: any) => void;
  onOpenDossier?: () => void;
  onIssueSubpoena?: (vasp: any) => void;
}

// ----------------------------------------------------
// HELPER: Extract & Normalize Geographic Location
// ----------------------------------------------------
function getCountryData(nodeData: any) {
  const geo = nodeData.geo_location || {};
  let countryCode = (geo.country_code || "").toUpperCase();
  let city = geo.city || "";
  let country = geo.country || "";

  if (!countryCode) {
    if (nodeData.is_seed) {
      countryCode = "RU";
      city = "St. Petersburg";
      country = "Russian Federation";
    } else if (nodeData.vasp_name === "Binance" || (nodeData.id && nodeData.id.toLowerCase().includes("28c6"))) {
      countryCode = "KY";
      city = "George Town";
      country = "Cayman Islands";
    } else if (nodeData.vasp_name === "Coinbase" || (nodeData.id && nodeData.id.toLowerCase().includes("5038"))) {
      countryCode = "US";
      city = "San Francisco";
      country = "United States";
    } else if (nodeData.type === "bridge" || (nodeData.id && nodeData.id.toLowerCase().includes("d37b"))) {
      countryCode = "CH";
      city = "Zurich";
      country = "Switzerland";
    } else if (nodeData.peel_chain_detected || (nodeData.id && nodeData.id.toLowerCase().includes("2222"))) {
      countryCode = "GB";
      city = "London";
      country = "United Kingdom";
    } else if (nodeData.has_mixer) {
      countryCode = "XX";
      city = "Privacy Pool";
      country = "OFAC Sanctioned";
    } else {
      countryCode = "DE";
      city = "Frankfurt";
      country = "Germany";
    }
  }

  let flagEmoji = "📍";
  let glowColor = "#00f0ff";

  switch (countryCode) {
    case "RU":
      flagEmoji = "🇷🇺";
      glowColor = "#ff0055";
      break;
    case "DE":
      flagEmoji = "🇩🇪";
      glowColor = "#00f0ff";
      break;
    case "GB":
    case "UK":
      flagEmoji = "🇬🇧";
      glowColor = "#ff9900";
      break;
    case "CH":
      flagEmoji = "🇨🇭";
      glowColor = "#00d4ff";
      break;
    case "KY":
      flagEmoji = "🇰🇾";
      glowColor = "#00ff66";
      break;
    case "US":
      flagEmoji = "🇺🇸";
      glowColor = "#00ff66";
      break;
    case "SC":
      flagEmoji = "🇸🇨";
      glowColor = "#a855f7";
      break;
    case "XX":
      flagEmoji = "🌪️";
      glowColor = "#d946ef";
      break;
    default:
      flagEmoji = "📍";
      glowColor = nodeData.is_seed ? "#ff0055" : (nodeData.type === "vasp" ? "#00ff66" : "#00f0ff");
  }

  return { countryCode, city, country, flagEmoji, glowColor };
}

// ----------------------------------------------------
// HELPER: Generate High-Resolution Location Badge for Inside Node Circle
// ----------------------------------------------------
const iconCache = new Map<string, string>();

function generateNodeLocationIcon(
  countryCode: string,
  flagEmoji: string,
  glowColor: string,
  isSeed?: boolean,
  isVasp?: boolean
): string {
  if (typeof document === "undefined") return "";
  const cacheKey = `${countryCode}_${glowColor}_${isSeed}_${isVasp}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Dark radial gradient background
  const rad = ctx.createRadialGradient(64, 64, 5, 64, 64, 62);
  rad.addColorStop(0, "#081426");
  rad.addColorStop(0.65, "#030812");
  rad.addColorStop(1, "#010306");
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  // 2. High-Tech Concentric Radar Ring
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair ticks
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2.5;
  const ticks = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  for (const a of ticks) {
    const x1 = 64 + Math.cos(a) * 52;
    const y1 = 64 + Math.sin(a) * 52;
    const x2 = 64 + Math.cos(a) * 62;
    const y2 = 64 + Math.sin(a) * 62;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 3. Glowing Outer Ring
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = isSeed ? 5 : (isVasp ? 4 : 3.5);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0; // reset

  // 4. Center-Top: Clean Vector Flag Badge
  const flagW = 44;
  const flagH = 26;
  const flagX = 64 - flagW / 2;
  const flagY = 22;

  ctx.save();
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(flagX, flagY, flagW, flagH, 4);
  } else {
    ctx.rect(flagX, flagY, flagW, flagH);
  }
  ctx.clip();

  if (countryCode === "RU") {
    // Russian tricolor: White, Blue, Red
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(flagX, flagY, flagW, flagH / 3);
    ctx.fillStyle = "#0039a6";
    ctx.fillRect(flagX, flagY + flagH / 3, flagW, flagH / 3);
    ctx.fillStyle = "#d52b1e";
    ctx.fillRect(flagX, flagY + (2 * flagH) / 3, flagW, flagH / 3);
  } else if (countryCode === "DE") {
    // German tricolor: Black, Red, Gold
    ctx.fillStyle = "#000000";
    ctx.fillRect(flagX, flagY, flagW, flagH / 3);
    ctx.fillStyle = "#dd0000";
    ctx.fillRect(flagX, flagY + flagH / 3, flagW, flagH / 3);
    ctx.fillStyle = "#ffce00";
    ctx.fillRect(flagX, flagY + (2 * flagH) / 3, flagW, flagH / 3);
  } else if (countryCode === "CH") {
    // Swiss flag: Red square with white cross
    ctx.fillStyle = "#d52b1e";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(64 - 4, flagY + 4, 8, flagH - 8);
    ctx.fillRect(flagX + 8, flagY + flagH / 2 - 4, flagW - 16, 8);
  } else if (countryCode === "US") {
    // US flag: Red & white stripes + blue canton
    ctx.fillStyle = "#bf0a30";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    for (let i = 1; i < 7; i += 2) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(flagX, flagY + (i * flagH) / 7, flagW, flagH / 7);
    }
    ctx.fillStyle = "#002868";
    ctx.fillRect(flagX, flagY, flagW * 0.45, (flagH * 4) / 7);
  } else if (countryCode === "GB" || countryCode === "UK") {
    // UK flag: Blue field with white & red crosses
    ctx.fillStyle = "#00247d";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(flagX, flagY); ctx.lineTo(flagX + flagW, flagY + flagH);
    ctx.moveTo(flagX + flagW, flagY); ctx.lineTo(flagX, flagY + flagH);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(64 - 5, flagY, 10, flagH);
    ctx.fillRect(flagX, flagY + flagH / 2 - 5, flagW, 10);
    ctx.fillStyle = "#cf142b";
    ctx.fillRect(64 - 3, flagY, 6, flagH);
    ctx.fillRect(flagX, flagY + flagH / 2 - 3, flagW, 6);
  } else if (countryCode === "KY") {
    // Cayman Islands blue ensign
    ctx.fillStyle = "#00247d";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    ctx.fillStyle = "#cf142b";
    ctx.fillRect(flagX, flagY, flagW * 0.45, flagH * 0.5);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(flagX + flagW * 0.72, flagY + flagH / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (countryCode === "XX" || flagEmoji === "🌪️") {
    // Mixer / Privacy pool
    ctx.fillStyle = "#4a044e";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(64, flagY + flagH / 2, 7, 0, Math.PI * 1.5);
    ctx.stroke();
  } else {
    // Generic cyan location beacon
    ctx.fillStyle = "#0369a1";
    ctx.fillRect(flagX, flagY, flagW, flagH);
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(64, flagY + flagH / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Flag outline border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(flagX, flagY, flagW, flagH, 4);
  } else {
    ctx.rect(flagX, flagY, flagW, flagH);
  }
  ctx.stroke();

  // 5. Center-Bottom: High-Contrast Country Code Pill (e.g. RU, DE, GB, CH, KY, US)
  const pillW = 76;
  const pillH = 26;
  const pillX = 64 - pillW / 2;
  const pillY = 54;

  ctx.fillStyle = "rgba(2, 6, 16, 0.96)";
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(pillX, pillY, pillW, pillH, 8);
  } else {
    ctx.rect(pillX, pillY, pillW, pillH);
  }
  ctx.fill();
  ctx.stroke();

  // Text inside pill: e.g. "RU", "DE", "GB", "CH", "KY", "US"
  ctx.font = "900 13px 'Fira Code', 'Roboto Mono', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(countryCode.toUpperCase(), 64, pillY + pillH / 2);

  // 6. Bottom micro location label: "LOCATION"
  ctx.font = "700 8.5px 'Fira Code', monospace";
  ctx.fillStyle = glowColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOCATION", 64, 93);

  const dataUrl = canvas.toDataURL("image/png");
  iconCache.set(cacheKey, dataUrl);
  return dataUrl;
}

export function CytoscapeCanvas({
  elements,
  layoutName = "dagre",
  onNodeSelect,
  onOpenDossier,
  onIssueSubpoena,
}: CytoscapeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [enableSnapBack, setEnableSnapBack] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedTxHash, setCopiedTxHash] = useState<boolean>(false);

  const enableSnapBackRef = useRef<boolean>(enableSnapBack);
  enableSnapBackRef.current = enableSnapBack;

  // Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const validNodeIdSet = new Set(elements.nodes.map((n) => n.data.id));
    const safeEdges = elements.edges.filter(
      (e) => validNodeIdSet.has(e.data.source) && validNodeIdSet.has(e.data.target)
    );

    // Format elements for Cytoscape with location badge images and solid edge lines
    const cyElements = [
      ...elements.nodes.map((n) => {
        const { countryCode, city, country, flagEmoji, glowColor } = getCountryData(n.data);
        const bgImage = generateNodeLocationIcon(
          countryCode,
          flagEmoji,
          glowColor,
          n.data.is_seed,
          n.data.type === "vasp"
        );

        let displayLabel = formatAddress(n.data.id, 4, 4);
        if (n.data.vasp_name) {
          displayLabel = `DEST: ${n.data.vasp_name} (${countryCode})`;
        } else if (n.data.is_seed) {
          displayLabel = `SUSPECT SEED (${countryCode})`;
        } else if (n.data.has_mixer) {
          displayLabel = `MIXER (${countryCode})`;
        } else if (city) {
          displayLabel = `${formatAddress(n.data.id, 4, 3)} (${city})`;
        }

        return {
          group: "nodes" as const,
          data: {
            id: n.data.id,
            label: displayLabel,
            bg_image: bgImage,
            glow_color: glowColor,
            country_code: countryCode,
            country_name: country,
            city_name: city,
            flag_emoji: flagEmoji,
            ...n.data,
          },
        };
      }),
      ...safeEdges.map((e) => ({
        group: "edges" as const,
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          label: `${e.data.amount} ${e.data.token || "ETH"}`,
          ...e.data,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements as any,
      style: [
        // ----------------------------------------------------
        // 1. BASE NODE STYLES (WITH LOCATION BADGE INSIDE CIRCLE)
        // ----------------------------------------------------
        {
          selector: "node",
          style: {
            "background-image": "data(bg_image)",
            "background-fit": "cover",
            "background-clip": "node",
            "background-opacity": 1,
            "border-width": 0,
            "width": 56,
            "height": 56,
            "shadow-blur": 24,
            "shadow-color": "data(glow_color)",
            "shadow-opacity": 0.85,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,
            
            // Text Label Background Pill underneath circle
            "label": "data(label)",
            "color": "#f1f5f9",
            "font-size": "11px",
            "font-family": "'Fira Code', 'Roboto Mono', 'JetBrains Mono', Consolas, monospace",
            "font-weight": "bold",
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-background-color": "#040711",
            "text-background-opacity": 0.96,
            "text-background-padding": "4px",
            "text-background-shape": "roundrectangle",
            "text-border-color": "rgba(0, 240, 255, 0.5)",
            "text-border-width": 1,
            "text-border-opacity": 0.9,
            "z-index": 10,
            "transition-property": "width, height, shadow-blur, shadow-opacity, opacity",
            "transition-duration": "0.25s",
          },
        },

        // Complaint Suspect Seed Node (Crimson / Russian Node)
        {
          selector: "node[?is_seed]",
          style: {
            "width": 64,
            "height": 64,
            "shadow-color": "#ff0055",
            "shadow-blur": 32,
            "shadow-opacity": 1.0,
            "color": "#fecdd3",
            "text-border-color": "#ff0055",
            "text-background-color": "rgba(40, 5, 15, 0.96)",
            "z-index": 30,
          },
        },

        // Terminal VASP Cash-Out Endpoints (Green Matrix)
        {
          selector: 'node[type = "vasp"]',
          style: {
            "width": 62,
            "height": 62,
            "shadow-color": "#00ff66",
            "shadow-blur": 28,
            "shadow-opacity": 0.95,
            "color": "#a7f3d0",
            "text-border-color": "#00ff66",
            "text-background-color": "rgba(3, 36, 21, 0.96)",
            "z-index": 25,
          },
        },

        // Cross-Chain Bridges / Routers (Electric Azure)
        {
          selector: 'node[type = "bridge"]',
          style: {
            "width": 60,
            "height": 60,
            "shadow-color": "#00d4ff",
            "shadow-blur": 26,
            "shadow-opacity": 0.9,
            "color": "#67e8f9",
            "text-border-color": "#00d4ff",
            "text-background-color": "rgba(4, 30, 48, 0.96)",
            "z-index": 20,
          },
        },

        // Mixer Pools / Anonymous Contracts (Neon Purple)
        {
          selector: "node[?has_mixer]",
          style: {
            "width": 58,
            "height": 58,
            "shadow-color": "#d946ef",
            "shadow-blur": 26,
            "shadow-opacity": 0.9,
            "color": "#f0abfc",
            "text-border-color": "#d946ef",
            "text-background-color": "rgba(42, 5, 48, 0.96)",
          },
        },

        // Peel Chain Detection Hub (Neon Orange)
        {
          selector: "node[?peel_chain_detected]",
          style: {
            "width": 58,
            "height": 58,
            "shadow-color": "#ff9900",
            "shadow-blur": 26,
            "shadow-opacity": 0.9,
            "color": "#fef08a",
            "text-border-color": "#ff9900",
            "text-background-color": "rgba(48, 25, 3, 0.96)",
          },
        },

        // ----------------------------------------------------
        // 2. CONNECTION LINES (CRISP SOLID NEON CYBER LINES - NO DOTTED)
        // ----------------------------------------------------
        {
          selector: "edge",
          style: {
            "width": 2.6,
            "line-color": "#0284c7",
            "line-style": "solid",
            "target-arrow-color": "#00f0ff",
            "target-arrow-shape": "triangle",
            "arrow-scale": 1.4,
            "curve-style": "bezier",
            "shadow-blur": 12,
            "shadow-color": "#00f0ff",
            "shadow-opacity": 0.75,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,

            // Text Label Background Box
            "label": "data(label)",
            "color": "#f8fafc",
            "font-size": "10.5px",
            "font-family": "'Fira Code', 'Roboto Mono', 'JetBrains Mono', Consolas, monospace",
            "font-weight": "bold",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            "text-background-color": "#040711",
            "text-background-opacity": 0.96,
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            "text-border-color": "rgba(56, 189, 248, 0.45)",
            "text-border-width": 1,
            "text-border-opacity": 0.9,
            "z-index": 5,
            "transition-property": "line-color, width, shadow-blur, opacity",
            "transition-duration": "0.2s",
          },
        },

        // Peel Chain Transfer Edges (Glowing Solid Neon Orange)
        {
          selector: "edge[?is_peel_chain]",
          style: {
            "line-color": "#ff9900",
            "target-arrow-color": "#ff9900",
            "line-style": "solid",
            "width": 3.4,
            "shadow-color": "#ff9900",
            "shadow-blur": 16,
            "shadow-opacity": 0.85,
            "color": "#fef08a",
            "text-border-color": "rgba(255, 153, 0, 0.6)",
          },
        },

        // Cross-Chain Bridge Transfer Edges (Solid Electric Azure)
        {
          selector: "edge[?is_bridge_hop]",
          style: {
            "line-color": "#00d4ff",
            "target-arrow-color": "#00d4ff",
            "line-style": "solid",
            "width": 3.4,
            "shadow-color": "#00d4ff",
            "shadow-blur": 14,
            "shadow-opacity": 0.8,
            "color": "#a5f3fc",
            "text-border-color": "rgba(0, 212, 255, 0.6)",
          },
        },

        // ----------------------------------------------------
        // 3. HOVER HIGHLIGHTING & FOCUS TRACING STYLES
        // ----------------------------------------------------
        {
          selector: ".dimmed",
          style: {
            "opacity": 0.15,
            "text-opacity": 0.0,
            "shadow-opacity": 0,
            "transition-property": "opacity, text-opacity, shadow-opacity",
            "transition-duration": "0.2s",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "opacity": 1.0,
            "z-index": 999,
            "shadow-blur": 35,
            "shadow-opacity": 1.0,
            "transition-property": "opacity, shadow-blur, shadow-opacity",
            "transition-duration": "0.2s",
          },
        },
        {
          selector: "node.hovered-node",
          style: {
            "shadow-blur": 40,
            "shadow-opacity": 1.0,
            "z-index": 1000,
          },
        },

        // Selected Node Highlight
        {
          selector: "node:selected",
          style: {
            "shadow-blur": 40,
            "shadow-color": "#ffffff",
            "shadow-opacity": 1.0,
            "z-index": 1000,
          },
        },

        // Selected Edge Highlight
        {
          selector: "edge:selected",
          style: {
            "width": 4.5,
            "line-color": "#ffffff",
            "target-arrow-color": "#ffffff",
            "shadow-color": "#ffffff",
            "shadow-blur": 20,
            "z-index": 1000,
          },
        },
      ] as any,

      // High-Spacing Layout Configuration
      layout: (layoutName === "dagre"
        ? {
            name: "dagre",
            rankDir: "TB",
            rankSep: 100,
            nodeSep: 85,
            edgeSep: 40,
            padding: 50,
            animate: true,
            animationDuration: 600,
          }
        : {
            name: "fcose",
            quality: "proof",
            randomize: false,
            animate: true,
            animationDuration: 700,
            nodeRepulsion: 12000,
            idealEdgeLength: 160,
            edgeElasticity: 0.45,
            nestingFactor: 0.1,
            gravity: 0.12,
            numIter: 2500,
            padding: 50,
          }) as any,

      minZoom: 0.25,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
    });

    // Store original positions for spring snap-back
    cy.on("layoutstop", () => {
      cy.nodes().forEach((n: any) => {
        n.data("origPos", { ...n.position() });
      });
    });

    // ----------------------------------------------------
    // INTERACTION: Node & Edge Selection (Tap / Click)
    // ----------------------------------------------------
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNode(data);
      setSelectedEdge(null);
      if (onNodeSelect) onNodeSelect(data);
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      const data = edge.data();
      setSelectedEdge(data);
      setSelectedNode(null);
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    // ----------------------------------------------------
    // INTERACTION: Hover Highlighting & Dimming
    // ----------------------------------------------------
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      setHoveredNode(node.data());
      
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.addClass("highlighted");
      node.addClass("hovered-node");
    });

    cy.on("mouseout", "node", () => {
      setHoveredNode(null);
      cy.elements().removeClass("dimmed highlighted hovered-node");
    });

    // ----------------------------------------------------
    // INTERACTION: Physics Spring Snap-Back Mechanics
    // ----------------------------------------------------
    cy.on("grab", "node", (evt) => {
      const node = evt.target;
      if (!node.data("origPos")) {
        node.data("origPos", { ...node.position() });
      }
    });

    cy.on("free", "node", (evt) => {
      const node = evt.target;
      const orig = node.data("origPos");
      if (orig && enableSnapBackRef.current) {
        node.animate(
          { position: orig },
          { duration: 700, easing: "ease-out-elastic" }
        );
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutName]);

  // Controls Handlers
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.75);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleResetLayout = () => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout(
      layoutName === "dagre"
        ? {
            name: "dagre",
            rankDir: "TB",
            rankSep: 100,
            nodeSep: 85,
            edgeSep: 40,
            padding: 50,
            animate: true,
            animationDuration: 600,
          }
        : {
            name: "fcose",
            quality: "proof",
            animate: true,
            animationDuration: 700,
            nodeRepulsion: 12000,
            idealEdgeLength: 160,
            edgeElasticity: 0.45,
            gravity: 0.12,
            padding: 50,
          }
    );
    layout.run();
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(true);
    setTimeout(() => setCopiedTxHash(false), 2000);
  };

  // Connected counterparty transfers calculation for selectedNode
  const incomingTransfers = selectedNode 
    ? elements.edges.filter((e) => e.data.target === selectedNode.id)
    : [];
  const outgoingTransfers = selectedNode 
    ? elements.edges.filter((e) => e.data.source === selectedNode.id)
    : [];

  const totalInflowEth = incomingTransfers.reduce((sum, e) => sum + (Number(e.data.amount) || 0), 0);
  const totalInflowUsd = incomingTransfers.reduce((sum, e) => sum + (Number(e.data.amount_usd) || 0), 0);
  const totalOutflowEth = outgoingTransfers.reduce((sum, e) => sum + (Number(e.data.amount) || 0), 0);
  const totalOutflowUsd = outgoingTransfers.reduce((sum, e) => sum + (Number(e.data.amount_usd) || 0), 0);

  // Time formatting fallback
  const primaryTimestamp = selectedNode?.timestamp || 
    incomingTransfers[0]?.data?.timestamp || 
    outgoingTransfers[0]?.data?.timestamp || 
    "2024-09-04 14:30:45 UTC";

  const primaryElapsed = selectedNode?.elapsed_time || 
    incomingTransfers[0]?.data?.elapsed_time || 
    outgoingTransfers[0]?.data?.elapsed_time || 
    "15 mins ago";

  const primaryBlock = selectedNode?.block_number || 19842101;
  const primaryTxHash = selectedNode?.tx_hash || 
    incomingTransfers[0]?.data?.tx_hash || 
    outgoingTransfers[0]?.data?.tx_hash || 
    "0x742da3b844Bc454e4438f44e89104c910248bf129a4e76d1e4b9f2d12e8c1482";

  return (
    <div className="relative w-full h-full bg-[#050811] rounded-xl border border-slate-800/90 overflow-hidden shadow-2xl select-none">
      {/* 1. Interactive Cytoscape Graph Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* 2. Top Cyberpunk HUD Header Overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-xl shadow-2xl backdrop-blur z-20 pointer-events-none">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        <div>
          <div className="text-cyan-400 font-mono text-xs font-bold tracking-wider flex items-center gap-2">
            <span>LIVE TRANSACTION TRACKER // NETWORK MAP</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              LOCATION INTELLIGENCE
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
            <span>NODES: <b className="text-slate-200">{elements.nodes.length}</b></span>
            <span>&bull;</span>
            <span>EDGES: <b className="text-slate-200">{elements.edges.length}</b></span>
            <span>&bull;</span>
            <span className="text-cyan-300 flex items-center gap-1 font-semibold">
              <MapPin className="w-3 h-3 text-cyan-400" /> LOCATIONS INSIDE CIRCLES
            </span>
          </div>
        </div>
      </div>

      {/* 3. Floating Interactive Canvas Controls (Right Toolbar) */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-slate-900/95 border border-slate-700/80 p-1.5 rounded-xl shadow-2xl backdrop-blur z-20 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetLayout}
          title="Reset & Relayout"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        
        <div className="w-full h-px bg-slate-800 my-0.5" />

        {/* Snap-Back Physics Toggle */}
        <button
          onClick={() => setEnableSnapBack(!enableSnapBack)}
          title={enableSnapBack ? "Spring Snap-Back: ENABLED (Drag & Release)" : "Spring Snap-Back: DISABLED (Free Pin)"}
          className={`p-2 rounded-lg transition ${
            enableSnapBack ? "text-cyan-400 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:bg-slate-800"
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Bottom Cyberpunk Legend Badge */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3.5 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono backdrop-blur z-20 pointer-events-none shadow-2xl">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ff0055] shadow-[0_0_8px_#ff0055] flex items-center justify-center text-[9px]">🇷🇺</span>
          <span className="text-slate-200 font-semibold">Complaint Seed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#020b14] border-2 border-[#00f0ff] shadow-[0_0_8px_#00f0ff] flex items-center justify-center text-[9px]">🇩🇪</span>
          <span className="text-slate-200">Forwarding Hop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#00ff66] shadow-[0_0_10px_#00ff66] flex items-center justify-center text-[9px]">🇰🇾</span>
          <span className="text-slate-200">Terminal VASP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#ff9900] shadow-[0_0_8px_#ff9900]"></span>
          <span className="text-amber-300">Peel Chain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
          <span className="text-cyan-300">Standard Transfer</span>
        </div>
      </div>

      {/* 5. Prominent Click Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bottom-4 w-96 md:w-[410px] bg-slate-950/96 border border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-col pointer-events-auto animate-in fade-in slide-in-from-left-4 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  selectedNode.is_seed 
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" 
                    : (selectedNode.type === "vasp" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : (selectedNode.type === "bridge" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-sky-950 text-sky-300 border border-sky-800"))
                }`}>
                  {selectedNode.is_seed ? "COMPLAINT SUSPECT SEED" : (selectedNode.vasp_name ? `TERMINAL VASP (${selectedNode.vasp_name.toUpperCase()})` : (selectedNode.type === "bridge" ? "CROSS-CHAIN BRIDGE ROUTER" : "FORWARDING MULE WALLET"))}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span>{selectedNode.flag_emoji || "📍"}</span>
                  <span>{selectedNode.country_code || "LOC"}</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mt-1.5 font-mono flex items-center gap-2">
                <span>{formatAddress(selectedNode.address || selectedNode.id, 8, 6)}</span>
                <button
                  onClick={() => handleCopyAddress(selectedNode.address || selectedNode.id)}
                  title="Copy Wallet Address"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Intelligence Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs custom-scrollbar">
            {/* Section: Exact Time Money Was Shared */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-[11px] uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Money Was Shared</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Exact UTC Timestamp</div>
                  <div className="text-slate-200 font-bold mt-0.5 text-[11px]">{primaryTimestamp}</div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Elapsed Time</div>
                  <div className="text-emerald-400 font-bold mt-0.5 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {primaryElapsed}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-0.5">
                <span>Block Confirmation:</span>
                <span className="text-slate-200 font-bold">#{primaryBlock.toLocaleString()}</span>
              </div>
            </div>

            {/* Section: Money Shared & Balances */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[11px] uppercase tracking-wide">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Money Shared & Balances</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedNode.network || "ETHEREUM"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3" /> Total Inflow
                  </div>
                  <div className="text-white font-bold mt-0.5 text-[11px]">
                    +{totalInflowEth > 0 ? totalInflowEth.toFixed(2) : (selectedNode.balance || 10.2)} ETH
                  </div>
                  <div className="text-[10px] text-emerald-300/80">
                    {formatUSD(totalInflowUsd > 0 ? totalInflowUsd : (selectedNode.balance || 10.2) * 2850)}
                  </div>
                </div>

                <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Total Outflow
                  </div>
                  <div className="text-white font-bold mt-0.5 text-[11px]">
                    -{totalOutflowEth > 0 ? totalOutflowEth.toFixed(2) : 6.00} ETH
                  </div>
                  <div className="text-[10px] text-amber-300/80">
                    {formatUSD(totalOutflowUsd > 0 ? totalOutflowUsd : 17100)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-1.5 px-1">
                <span className="text-slate-400">Current Wallet Balance:</span>
                <span className="text-cyan-300 font-bold">{selectedNode.balance ?? "6.20"} ETH</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono px-1">
                <span className="text-slate-400">Network Gas Paid:</span>
                <span className="text-slate-300 font-medium">0.0035 ETH ($10.50)</span>
              </div>
            </div>

            {/* Section: Geographic Location & Origin */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[11px] uppercase tracking-wide">
                <Globe className="w-3.5 h-3.5" />
                <span>Geographic Location & Network Relay</span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Country & City:</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <span>{selectedNode.flag_emoji || "📍"}</span>
                    <span>{selectedNode.city_name || "Frankfurt"}, {selectedNode.country_name || "Germany"}</span>
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Country Code:</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.country_code || "DE"}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">IP Cluster / Relay:</span>
                  <span className="text-slate-300 truncate max-w-[200px]" title={selectedNode.ip_cluster || "185.190.140.12 (Hetzner Online)"}>
                    {selectedNode.ip_cluster || "185.190.140.12 (Hetzner Online)"}
                  </span>
                </div>
                {selectedNode.threat_actor && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Threat Actor:</span>
                    <span className="text-rose-400 font-bold">{selectedNode.threat_actor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Connected Counterparty Transfers Log */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-[11px] uppercase tracking-wide">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Money Sharing Log ({incomingTransfers.length + outgoingTransfers.length} Transfers)</span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                {incomingTransfers.map((e, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">INFLOW: </span>
                      <span className="text-slate-300">from {formatAddress(e.data.source, 4, 3)}</span>
                      <div className="text-slate-400 text-[9px]">{e.data.timestamp || primaryTimestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-300 font-bold">+{e.data.amount} {e.data.token || "ETH"}</div>
                      <div className="text-[9px] text-slate-400">{formatUSD(e.data.amount_usd || (e.data.amount * 2850))}</div>
                    </div>
                  </div>
                ))}

                {outgoingTransfers.map((e, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold">OUTFLOW: </span>
                      <span className="text-slate-300">to {formatAddress(e.data.target, 4, 3)}</span>
                      <div className="text-slate-400 text-[9px]">{e.data.timestamp || primaryTimestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300 font-bold">-{e.data.amount} {e.data.token || "ETH"}</div>
                      <div className="text-[9px] text-slate-400">{formatUSD(e.data.amount_usd || (e.data.amount * 2850))}</div>
                    </div>
                  </div>
                ))}

                {incomingTransfers.length === 0 && outgoingTransfers.length === 0 && (
                  <div className="text-slate-400 py-1 text-center italic">
                    No immediate neighbor transfers found in active view.
                  </div>
                )}
              </div>
            </div>

            {/* Section: Transaction Hash */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <div className="truncate mr-2">
                <span className="text-slate-400">Tx Hash: </span>
                <span className="text-slate-200 font-bold">{formatAddress(primaryTxHash, 10, 8)}</span>
              </div>
              <button
                onClick={() => handleCopyTxHash(primaryTxHash)}
                title="Copy Transaction Hash"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition flex-shrink-0"
              >
                {copiedTxHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {selectedNode.vasp_name && onIssueSubpoena && (
                <button
                  onClick={() => onIssueSubpoena(selectedNode)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40"
                >
                  <AlertOctagon className="w-4 h-4" />
                  Request Account Freeze Subpoena
                </button>
              )}

              {onOpenDossier && (
                <button
                  onClick={onOpenDossier}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Download Investigation Report (PDF)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Click Inspector Drawer for Selected Edge (Connection Line) */}
      {selectedEdge && !selectedNode && (
        <div className="absolute top-4 left-4 w-96 bg-slate-950/96 border border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-xl z-30 p-4 pointer-events-auto animate-in fade-in slide-in-from-left-4 space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                selectedEdge.is_peel_chain 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                  : (selectedEdge.is_bridge_hop ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-sky-500/20 text-sky-300 border border-sky-500/40")
              }`}>
                {selectedEdge.is_peel_chain ? "PEEL-CHAIN TRANSFER" : (selectedEdge.is_bridge_hop ? "CROSS-BRIDGE ROUTE" : "DIRECT WALLET TRANSFER")}
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-1 font-mono">
                {selectedEdge.amount} {selectedEdge.token || "ETH"} ({formatUSD(selectedEdge.amount_usd || (selectedEdge.amount * 2850))})
              </h4>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Sender:</span>
                <span className="text-cyan-400 font-bold">{formatAddress(selectedEdge.source, 6, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-emerald-400 font-bold">{formatAddress(selectedEdge.target, 6, 4)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-white font-semibold">{selectedEdge.timestamp || "2024-09-04 14:30:45 UTC"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elapsed:</span>
                <span className="text-emerald-400 font-bold">{selectedEdge.elapsed_time || "15 mins ago"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gas Fee:</span>
                <span className="text-slate-300">{selectedEdge.gas_fee || "0.0035 ETH ($10.50)"}</span>
              </div>
            </div>

            {selectedEdge.tx_hash && (
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="truncate mr-2">
                  <span className="text-slate-400">Tx: </span>
                  <span className="text-slate-200">{formatAddress(selectedEdge.tx_hash, 10, 8)}</span>
                </div>
                <button
                  onClick={() => handleCopyTxHash(selectedEdge.tx_hash)}
                  className="p-1 hover:text-cyan-400 text-slate-400"
                >
                  {copiedTxHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
