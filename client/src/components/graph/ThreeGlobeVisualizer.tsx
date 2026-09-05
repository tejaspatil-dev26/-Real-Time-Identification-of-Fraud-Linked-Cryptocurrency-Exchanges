"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { 
  Globe2, 
  ShieldAlert, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Layers, 
  ExternalLink, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Flame,
  Info
} from "lucide-react";
import { formatUSD, formatAddress } from "@/lib/utils";
import { 
  COUNTRY_CENTROIDS, 
  latLngToVector3, 
  createEarthCanvasTexture, 
  create3DBorderLines,
  CountryCentroid
} from "@/data/worldData";

export interface VaspHit {
  name: string;
  jurisdiction?: string;
  volume_usd?: number;
  risk?: string;
  lat?: number;
  lng?: number;
  deposit_address?: string;
}

export interface SuspectOrigin {
  alias?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  ip_cluster?: string;
}

export interface ThreeGlobeVisualizerProps {
  vaspHits?: VaspHit[];
  suspectOrigin?: SuspectOrigin;
  onSelectVasp?: (vasp: VaspHit) => void;
  onOpenDossier?: () => void;
}

interface ActiveTransferRoute {
  id: string;
  fromName: string;
  fromLat: number;
  fromLng: number;
  toName: string;
  toLat: number;
  toLng: number;
  amountUsd: number;
  amountCrypto: string;
  token: string;
  risk: "LOW" | "HIGH" | "CRITICAL";
  curve: THREE.QuadraticBezierCurve3;
}

export function ThreeGlobeVisualizer({ 
  vaspHits = [], 
  suspectOrigin,
  onSelectVasp, 
  onOpenDossier 
}: ThreeGlobeVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<VaspHit | null>(null);
  const [activeCountry, setActiveCountry] = useState<CountryCentroid | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeRouteFilter, setActiveRouteFilter] = useState<"ALL" | "HIGH_RISK">("ALL");

  // Camera animation refs to handle external UI buttons (Zoom In, Zoom Out, Focus, Reset)
  const cameraControlRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    focusLocation: (lat: number, lng: number, zoomLevel?: number) => void;
    toggleRotation: () => void;
  } | null>(null);

  // Default targets if none passed from parent
  const defaultTargets: VaspHit[] = [
    { name: "Binance Custodial Hub", jurisdiction: "Cayman Islands", volume_usd: 13680, risk: "LOW", lat: 19.2838, lng: -81.3675, deposit_address: "0x28C6c06298d514Db089934071355E5743bf21d60" },
    { name: "Coinbase Hot Wallet", jurisdiction: "United States", volume_usd: 11400, risk: "LOW", lat: 37.7749, lng: -122.4194, deposit_address: "0x503828976D22510aad0201ac7EC88293211A23Dc" },
    { name: "ThorChain Native Router", jurisdiction: "Switzerland", volume_usd: 12500, risk: "HIGH", lat: 47.3769, lng: 8.5417, deposit_address: "0xd37B5C7a8b4E45621A15bA78e63F52E58C367146" },
    { name: "OKX OTC Liquidity", jurisdiction: "Seychelles", volume_usd: 9500, risk: "LOW", lat: -4.6796, lng: 55.4920, deposit_address: "0x3361a4f5f8b9e11c97a8e8e7b99c01d4a52e987c" },
  ];

  const targets = vaspHits.length > 0 ? vaspHits : defaultTargets;

  const origin = {
    alias: suspectOrigin?.alias || "ShadowVault Syndicate (APT-44)",
    city: suspectOrigin?.city || "St. Petersburg",
    country: suspectOrigin?.country || "Russian Federation",
    lat: suspectOrigin?.lat ?? 59.9343,
    lng: suspectOrigin?.lng ?? 30.3351,
    ip_cluster: suspectOrigin?.ip_cluster || "91.240.118.42 (Selectel Cloud)"
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Zoom control variables
    const MIN_DISTANCE = 1.92; // Close-up detailed inspection zoom
    const MAX_DISTANCE = 6.2;  // Full orbital worldwide view
    const DEFAULT_DISTANCE = 4.2;
    let targetDistance = DEFAULT_DISTANCE;
    let currentDistance = DEFAULT_DISTANCE;
    camera.position.set(0, 0, currentDistance);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Base Globe Group for rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 1.6;

    // 3. Realistic Atmosphere Outer Glow
    const atmosphereGeom = new THREE.SphereGeometry(radius * 1.06, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.10,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    globeGroup.add(atmosphere);

    // Subtle inner atmospheric aura
    const innerAuraGeom = new THREE.SphereGeometry(radius * 1.015, 48, 48);
    const innerAuraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.FrontSide,
    });
    const innerAura = new THREE.Mesh(innerAuraGeom, innerAuraMat);
    globeGroup.add(innerAura);

    // 4. Procedural High-Resolution Earth Map Surface
    const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
    let earthMaterial = new THREE.MeshBasicMaterial({
      map: createEarthCanvasTexture(), // Initial procedural texture
      color: 0xffffff,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Load detailed GeoJSON for dynamic high-res country borders & updated texture
    let borderLinesMesh: THREE.LineSegments | null = null;
    fetch("/countries.json")
      .then((res) => res.json())
      .then((geoJson) => {
        // Update earth texture with exact GeoJSON country outlines
        const newTexture = createEarthCanvasTexture(geoJson);
        earthMesh.material = new THREE.MeshBasicMaterial({ map: newTexture });

        // Add 3D Vector Country Borders overlay
        borderLinesMesh = create3DBorderLines(geoJson, radius * 1.002);
        globeGroup.add(borderLinesMesh);
      })
      .catch((err) => {
        console.warn("Using procedural fallback world map borders:", err);
      });

    // 5. Country 3D Floating Billboards (Recognizable Country Labels)
    const labelSprites: { sprite: THREE.Sprite; country: CountryCentroid; normal: THREE.Vector3 }[] = [];

    const createTextSprite = (text: string, color: string = "#38bdf8", bgColor: string = "rgba(4, 10, 22, 0.82)") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Sprite();

      // Background rounded tag
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 48, 10);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        depthTest: false 
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.32, 0.08, 1);
      return sprite;
    };

    // Add country labels for prominent nations
    COUNTRY_CENTROIDS.forEach((country) => {
      if (!country.prominent) return;
      const pos = latLngToVector3(country.lat, country.lng, radius * 1.035);
      const sprite = createTextSprite(country.name.toUpperCase(), "#7dd3fc", "rgba(5, 12, 26, 0.85)");
      sprite.position.copy(pos);
      globeGroup.add(sprite);

      labelSprites.push({
        sprite,
        country,
        normal: pos.clone().normalize(),
      });
    });

    // 6. Transaction Flow Setup (Origin -> Destinations)
    const originVec = latLngToVector3(origin.lat, origin.lng, radius);

    // Origin Beacon Ring & Pin (Crimson / Suspect)
    const originGroup = new THREE.Group();
    originGroup.position.copy(originVec);
    globeGroup.add(originGroup);

    const originPinGeom = new THREE.SphereGeometry(0.045, 24, 24);
    const originPinMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const originPin = new THREE.Mesh(originPinGeom, originPinMat);
    originGroup.add(originPin);

    // Suspect Origin Label Sprite
    const originSprite = createTextSprite("SUSPECT ORIGIN (RU)", "#fb7185", "rgba(76, 5, 25, 0.9)");
    originSprite.position.set(0, 0.08, 0);
    originSprite.scale.set(0.42, 0.105, 1);
    originGroup.add(originSprite);

    // Concentric pulsating waves at Suspect Origin
    const waveGeom = new THREE.RingGeometry(0.04, 0.065, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const originWave = new THREE.Mesh(waveGeom, waveMat);
    originWave.lookAt(originVec.clone().multiplyScalar(2));
    originGroup.add(originWave);

    // 7. Dynamic Transfer Arcs & Flowing Photon Packets
    const routes: ActiveTransferRoute[] = [];
    const pulsePackets: { mesh: THREE.Mesh; routeIdx: number; offset: number; speed: number }[] = [];
    const destinationRings: { mesh: THREE.Mesh; target: VaspHit }[] = [];

    targets.forEach((t, idx) => {
      const targetLat = t.lat ?? 19.2838;
      const targetLng = t.lng ?? -81.3675;
      const targetVec = latLngToVector3(targetLat, targetLng, radius);

      // Destination Pin (Emerald for regular, Amber for high risk)
      const isHighRisk = t.risk === "HIGH" || t.risk === "CRITICAL";
      const pinColor = isHighRisk ? 0xf59e0b : 0x10b981;

      const targetGroup = new THREE.Group();
      targetGroup.position.copy(targetVec);
      globeGroup.add(targetGroup);

      const pinGeom = new THREE.SphereGeometry(0.038, 20, 20);
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      targetGroup.add(pin);

      // Destination Radar Ring
      const destRingGeom = new THREE.RingGeometry(0.035, 0.055, 32);
      const destRingMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const destRing = new THREE.Mesh(destRingGeom, destRingMat);
      destRing.lookAt(targetVec.clone().multiplyScalar(2));
      targetGroup.add(destRing);
      destinationRings.push({ mesh: destRing, target: t });

      // Destination Label Sprite
      const destSprite = createTextSprite(
        `${t.name.split(" ")[0]} (${formatUSD(t.volume_usd || 0)})`, 
        isHighRisk ? "#fbbf24" : "#34d399", 
        isHighRisk ? "rgba(40, 20, 5, 0.9)" : "rgba(4, 30, 20, 0.9)"
      );
      destSprite.position.set(0, 0.075, 0);
      destSprite.scale.set(0.38, 0.095, 1);
      targetGroup.add(destSprite);

      // 3D Elevated Bezier Curve Arc (Crypto Transfer Pathway)
      const midPoint = new THREE.Vector3().addVectors(originVec, targetVec).multiplyScalar(0.5);
      const distance = originVec.distanceTo(targetVec);
      // Lift the arc into orbital space
      midPoint.normalize().multiplyScalar(radius + distance * 0.42);

      const curve = new THREE.QuadraticBezierCurve3(originVec, midPoint, targetVec);
      const tubeGeom = new THREE.TubeGeometry(curve, 48, 0.009, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: isHighRisk ? 0xf59e0b : 0x06b6d4,
        transparent: true,
        opacity: 0.65,
      });
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      globeGroup.add(tubeMesh);

      routes.push({
        id: `route-${idx}`,
        fromName: origin.city,
        fromLat: origin.lat,
        fromLng: origin.lng,
        toName: t.name,
        toLat: targetLat,
        toLng: targetLng,
        amountUsd: t.volume_usd || 10000,
        amountCrypto: (t.volume_usd ? (t.volume_usd / 3100).toFixed(2) : "3.5") + " ETH",
        token: "ETH",
        risk: isHighRisk ? "HIGH" : "LOW",
        curve,
      });

      // Flowing Energy Photon Packets (3 per route for continuous fluid flow)
      for (let p = 0; p < 3; p++) {
        const packetGeom = new THREE.SphereGeometry(0.022, 12, 12);
        const packetMat = new THREE.MeshBasicMaterial({
          color: isHighRisk ? 0xfef08a : 0x67e8f9,
        });
        const packetMesh = new THREE.Mesh(packetGeom, packetMat);
        globeGroup.add(packetMesh);

        pulsePackets.push({
          mesh: packetMesh,
          routeIdx: idx,
          offset: p / 3,
          speed: 0.004 + (idx % 2) * 0.001,
        });
      }
    });

    // 8. Cosmic Dust / Ambient Space Particles
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * 1.08 + Math.random() * 0.35;
      particlePos[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = r * Math.cos(phi);
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.022,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    globeGroup.add(particles);

    // 9. Interactive Dragging, Inertia & Smooth Touch Controls
    let isDragging = false;
    let autoRotate = true;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0.2;
    let targetRotationY = -0.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.006;
      targetRotationX += deltaY * 0.006;
      targetRotationX = Math.max(-1.4, Math.min(1.4, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // 10. Interactive Smooth Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Adjust distance based on scroll delta
      targetDistance += e.deltaY * 0.0025;
      targetDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetDistance));
      
      const pct = Math.round(((DEFAULT_DISTANCE - targetDistance) / (DEFAULT_DISTANCE - MIN_DISTANCE)) * 100) + 100;
      setZoomPercent(Math.max(50, Math.min(300, pct)));
    };

    // Touch Support for mobile & touchscreens (Drag & Pinch-to-Zoom)
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.006;
        targetRotationX += deltaY * 0.006;
        targetRotationX = Math.max(-1.4, Math.min(1.4, targetRotationX));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = touchStartDist - dist;
        targetDistance += delta * 0.005;
        targetDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetDistance));
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // 11. Expose camera control methods to React toolbar buttons
    cameraControlRef.current = {
      zoomIn: () => {
        targetDistance = Math.max(MIN_DISTANCE, targetDistance - 0.55);
        const pct = Math.round(((DEFAULT_DISTANCE - targetDistance) / (DEFAULT_DISTANCE - MIN_DISTANCE)) * 100) + 100;
        setZoomPercent(Math.max(50, Math.min(300, pct)));
      },
      zoomOut: () => {
        targetDistance = Math.min(MAX_DISTANCE, targetDistance + 0.55);
        const pct = Math.round(((DEFAULT_DISTANCE - targetDistance) / (DEFAULT_DISTANCE - MIN_DISTANCE)) * 100) + 100;
        setZoomPercent(Math.max(50, Math.min(300, pct)));
      },
      resetView: () => {
        targetDistance = DEFAULT_DISTANCE;
        targetRotationX = 0.2;
        targetRotationY = -0.5;
        setZoomPercent(100);
        autoRotate = true;
        setIsRotating(true);
        setActiveEndpoint(null);
        setActiveCountry(null);
      },
      focusLocation: (lat: number, lng: number, zoomLevel = 2.45) => {
        // Calculate spherical rotations to orient target directly to camera
        const phi = (lat * Math.PI) / 180;
        const theta = ((lng + 90) * Math.PI) / 180;
        targetRotationX = phi;
        targetRotationY = -theta;
        targetDistance = Math.max(MIN_DISTANCE, zoomLevel);
        const pct = Math.round(((DEFAULT_DISTANCE - targetDistance) / (DEFAULT_DISTANCE - MIN_DISTANCE)) * 100) + 100;
        setZoomPercent(Math.max(50, Math.min(300, pct)));
        autoRotate = false;
        setIsRotating(false);
      },
      toggleRotation: () => {
        autoRotate = !autoRotate;
        setIsRotating(autoRotate);
      },
    };

    // 12. Animation Render Loop
    let animationFrameId: number;
    let waveScale = 1.0;
    let waveOpacity = 0.8;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.016;

      // Smooth Camera Zoom Interpolation (Exponential dampening)
      currentDistance += (targetDistance - currentDistance) * 0.085;
      camera.position.setLength(currentDistance);

      // Smooth Globe Rotation Interpolation
      if (autoRotate && !isDragging) {
        targetRotationY += 0.0018;
      }
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.09;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.09;

      // Animate Origin Pulsing Beacon Waves
      waveScale += 0.015;
      waveOpacity -= 0.012;
      if (waveScale > 2.2) {
        waveScale = 1.0;
        waveOpacity = 0.8;
      }
      originWave.scale.set(waveScale, waveScale, 1);
      (originWave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, waveOpacity);

      // Animate Destination Radar Target Rings
      destinationRings.forEach((dr, i) => {
        const pulse = 1.0 + Math.sin(time * 4 + i) * 0.25;
        dr.mesh.scale.set(pulse, pulse, 1);
      });

      // Animate Flowing Photon Packets along Crypto Transfer Arcs
      pulsePackets.forEach((p) => {
        p.offset += p.speed;
        if (p.offset > 1.0) p.offset = 0.0;
        const currentRoute = routes[p.routeIdx];
        if (currentRoute) {
          const point = currentRoute.curve.getPoint(p.offset);
          p.mesh.position.copy(point);

          // Subtle glowing scale breathing
          const pulseScale = 1.0 + Math.sin(p.offset * Math.PI) * 0.6;
          p.mesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
      });

      // Update Billboard Country Labels Opacity based on Globe Curvature
      // Fades out labels that are on the back side of the Earth
      const cameraDir = camera.position.clone().normalize();
      labelSprites.forEach(({ sprite, normal }) => {
        const worldNormal = normal.clone().applyEuler(globeGroup.rotation);
        const dot = worldNormal.dot(cameraDir);
        if (dot < 0.15) {
          sprite.material.opacity = 0;
        } else {
          sprite.material.opacity = Math.min(0.9, (dot - 0.15) * 2.8);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 13. Handle Window / Element Resizing
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [vaspHits, suspectOrigin]);

  // Quick Action Handlers
  const handleZoomIn = () => cameraControlRef.current?.zoomIn();
  const handleZoomOut = () => cameraControlRef.current?.zoomOut();
  const handleResetView = () => cameraControlRef.current?.resetView();
  const handleToggleRotation = () => cameraControlRef.current?.toggleRotation();

  const handleFocusCountry = (c: CountryCentroid) => {
    setActiveCountry(c);
    setActiveEndpoint(null);
    cameraControlRef.current?.focusLocation(c.lat, c.lng, 2.3);
  };

  const handleFocusEndpoint = (t: VaspHit) => {
    setActiveEndpoint(t);
    setActiveCountry(null);
    cameraControlRef.current?.focusLocation(t.lat || 0, t.lng || 0, 2.1);
  };

  const handleFocusOrigin = () => {
    setActiveEndpoint(null);
    setActiveCountry(null);
    cameraControlRef.current?.focusLocation(origin.lat, origin.lng, 2.2);
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#050914] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* 3D WebGL Canvas Mount */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" 
      />

      {/* Top Header HUD: Status & Real-Time Telemetry */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-lg text-xs font-mono backdrop-blur shadow-xl pointer-events-auto">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-slate-100 font-bold tracking-wider">
            3D GLOBAL TRANSACTION MAP // SATELLITE RADAR
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE ROUTING ACTIVE
          </span>
        </div>

        {/* Quick Country Focus Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg text-xs font-mono backdrop-blur pointer-events-auto overflow-x-auto max-w-full">
          <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> Focus:
          </span>
          <button
            onClick={handleFocusOrigin}
            className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition text-[11px] font-bold whitespace-nowrap"
          >
            Suspect (RU)
          </button>
          {targets.map((t, idx) => (
            <button
              key={idx}
              onClick={() => handleFocusEndpoint(t)}
              className={`px-2 py-1 rounded border transition text-[11px] whitespace-nowrap ${
                activeEndpoint?.name === t.name 
                  ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400" 
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {t.name.split(" ")[0]} ({t.jurisdiction?.substring(0, 2) || "EX"})
            </button>
          ))}
        </div>
      </div>

      {/* Floating Interactive Zoom & View Controls Toolbar (Right Side) */}
      <div className="absolute right-4 top-20 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-col bg-slate-900/95 border border-slate-700 rounded-xl p-1 shadow-2xl backdrop-blur">
          <button
            onClick={handleZoomIn}
            title="Zoom In (or use Mouse Wheel)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleZoomOut}
            title="Zoom Out (or use Mouse Wheel)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleResetView}
            title="Reset to Worldwide View"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleToggleRotation}
            title={isRotating ? "Pause Auto-Rotation" : "Resume Auto-Rotation"}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {isRotating ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Current Zoom Level Badge */}
        <div className="bg-slate-950/90 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono text-center text-cyan-400 backdrop-blur font-bold shadow-lg">
          ZOOM: {zoomPercent}%
        </div>
      </div>

      {/* Interactive Detail Drawer for Clicked / Focused Endpoint */}
      {activeEndpoint && (
        <div className="absolute left-4 top-20 z-10 w-80 bg-slate-900/95 border border-emerald-500/40 rounded-xl p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-left-4 pointer-events-auto space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                TERMINAL DESTINATION
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-1 font-mono">{activeEndpoint.name}</h4>
            </div>
            <button
              onClick={() => setActiveEndpoint(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Jurisdiction:</span>
              <span className="text-slate-200 font-semibold">{activeEndpoint.jurisdiction || "Global Offshore"}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Absorbed:</span>
              <span className="text-emerald-400 font-bold font-mono">{formatUSD(activeEndpoint.volume_usd || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Risk Rating:</span>
              <span className={`font-bold font-mono ${activeEndpoint.risk === "HIGH" ? "text-amber-400" : "text-emerald-400"}`}>
                {activeEndpoint.risk || "LOW"} RISK
              </span>
            </div>
            {activeEndpoint.deposit_address && (
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 break-all">
                <span className="text-slate-500 block">Deposit Address:</span>
                {activeEndpoint.deposit_address}
              </div>
            )}
          </div>

          <div className="pt-1 flex gap-2">
            {onSelectVasp && (
              <button
                onClick={() => onSelectVasp(activeEndpoint)}
                className="flex-1 py-1.5 px-2 rounded bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-md shadow-rose-500/20"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Request Account Freeze
              </button>
            )}
            {onOpenDossier && (
              <button
                onClick={onOpenDossier}
                className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                title="View Full Report"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Footer HUD: Live Flow Routes & Legend */}
      <div className="relative z-10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Legend & Transfer Path Guide */}
        <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono backdrop-blur pointer-events-auto flex-wrap shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-slate-200 font-semibold">Origin (Suspect Wallet)</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-200">Exchanges &amp; Endpoints</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-cyan-300">Live Crypto Transfer Flow</span>
          </div>
        </div>

        {/* Live Transfer Flow Ticker */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-cyan-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-mono backdrop-blur pointer-events-auto shadow-xl">
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
            {origin.city}
          </span>
          <span className="text-slate-400">➔</span>
          <span className="text-emerald-400 font-bold">
            {targets.length} Global Exchanges
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Total {formatUSD(targets.reduce((acc, curr) => acc + (curr.volume_usd || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
