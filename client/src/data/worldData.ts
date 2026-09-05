import * as THREE from "three";
import countriesCentroidsRaw from "./countriesCentroids.json";

export interface CountryCentroid {
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  prominent: boolean;
}

export const COUNTRY_CENTROIDS: CountryCentroid[] = countriesCentroidsRaw as CountryCentroid[];

// Convert latitude and longitude to 3D Cartesian coordinates on a sphere
export function latLngToVector3(lat: number, lng: number, radius: number = 1.6): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Convert 3D Cartesian vector back to Latitude/Longitude
export function vector3ToLatLng(vec: THREE.Vector3): { lat: number; lng: number } {
  const norm = vec.clone().normalize();
  const lat = 90 - Math.acos(norm.y) * (180 / Math.PI);
  let lng = Math.atan2(norm.z, -norm.x) * (180 / Math.PI) - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  return { lat, lng };
}

// Convert Lat/Lng to Equirectangular Canvas coordinates
export function latLngToCanvasXY(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * Procedurally generates a rich, realistic Earth map canvas texture
 * featuring oceans, continental landmasses, latitude/longitude graticules,
 * country borders, and recognizable country typography.
 */
export function createEarthCanvasTexture(geoJsonData?: any): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallbackCanvas = document.createElement("canvas");
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  // 1. Deep Oceanic Gradient (Tactical Cyber Navy / Deep Space Blue)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#06101e");
  oceanGrad.addColorStop(0.2, "#081628");
  oceanGrad.addColorStop(0.5, "#0b1d35");
  oceanGrad.addColorStop(0.8, "#081628");
  oceanGrad.addColorStop(1, "#06101e");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Graticule Lines (Latitude & Longitude Grid)
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.setLineDash([4, 6]);

  // Longitude Meridians every 30 degrees
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Latitude Parallels every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Highlight Equator & Prime Meridian
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
  ctx.lineWidth = 1.5;
  // Equator
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  // Prime Meridian
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // 3. Draw Continental Landmasses & Country Polygons
  if (geoJsonData && geoJsonData.features) {
    ctx.fillStyle = "#112641"; // Tactical Landmass fill
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)"; // National Border line color
    ctx.lineWidth = 1.2;

    for (const feature of geoJsonData.features) {
      const gtype = feature.geometry?.type;
      const coords = feature.geometry?.coordinates;
      if (!coords) continue;

      const drawRing = (ring: number[][]) => {
        if (!ring || ring.length === 0) return;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const pt = ring[i];
          const { x, y } = latLngToCanvasXY(pt[1], pt[0], width, height);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      if (gtype === "Polygon") {
        for (const ring of coords) {
          drawRing(ring);
        }
      } else if (gtype === "MultiPolygon") {
        for (const poly of coords) {
          for (const ring of poly) {
            drawRing(ring);
          }
        }
      }
    }
  } else {
    // Basic continental fallback shapes if GeoJSON is loading
    drawFallbackContinents(ctx, width, height);
  }

  // 4. Draw Recognizable Country Labels on the Map Surface
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const c of COUNTRY_CENTROIDS) {
    if (!c.prominent) continue;
    const { x, y } = latLngToCanvasXY(c.lat, c.lng, width, height);

    // Subtle background halo for high legibility
    ctx.fillStyle = "rgba(4, 9, 18, 0.85)";
    const label = c.name.toUpperCase();
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(x - textWidth / 2 - 4, y - 9, textWidth + 8, 18);

    // Glowing cyan/slate country text
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(label, x, y);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Fallback continental outline drawer in case GeoJSON isn't loaded yet
function drawFallbackContinents(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#112641";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 1.5;

  // North America
  ctx.beginPath();
  ctx.ellipse(width * 0.22, height * 0.32, width * 0.12, height * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // South America
  ctx.beginPath();
  ctx.ellipse(width * 0.31, height * 0.68, width * 0.08, height * 0.18, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eurasia (Europe + Asia)
  ctx.beginPath();
  ctx.ellipse(width * 0.68, height * 0.33, width * 0.24, height * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Africa
  ctx.beginPath();
  ctx.ellipse(width * 0.53, height * 0.58, width * 0.09, height * 0.19, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Australia
  ctx.beginPath();
  ctx.ellipse(width * 0.86, height * 0.72, width * 0.07, height * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Builds 3D Vector LineSegments geometry for all national borders from GeoJSON
 * Placed at radius * 1.002 to render crisp, pixel-perfect borders at any zoom level.
 */
export function create3DBorderLines(geoJsonData: any, radius: number = 1.602): THREE.LineSegments {
  const points: number[] = [];

  if (geoJsonData && geoJsonData.features) {
    for (const feature of geoJsonData.features) {
      const gtype = feature.geometry?.type;
      const coords = feature.geometry?.coordinates;
      if (!coords) continue;

      const processRing = (ring: number[][]) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = ring[i];
          const p2 = ring[i + 1];
          const v1 = latLngToVector3(p1[1], p1[0], radius);
          const v2 = latLngToVector3(p2[1], p2[0], radius);
          points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
      };

      if (gtype === "Polygon") {
        for (const ring of coords) processRing(ring);
      } else if (gtype === "MultiPolygon") {
        for (const poly of coords) {
          for (const ring of poly) processRing(ring);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.48,
  });

  return new THREE.LineSegments(geometry, material);
}
