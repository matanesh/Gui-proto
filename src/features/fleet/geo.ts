import type { AccessPoint } from "@/models";

/**
 * Geodesic helpers for the coverage sector. Uses a spherical-earth
 * destination-point formula — accurate enough for the sub-km ranges here.
 */
const EARTH_RADIUS_M = 6_378_137;

type LatLng = [number, number];

/** Point reached from (lat,lng) after travelling `distanceM` at `bearingDeg` (from north, clockwise). */
export function destinationPoint(lat: number, lng: number, bearingDeg: number, distanceM: number): LatLng {
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return [(φ2 * 180) / Math.PI, (((λ2 * 180) / Math.PI + 540) % 360) - 180];
}

/**
 * Polygon points for a coverage sector ("pizza slice"): apex at the access
 * point, spanning `fov` degrees centered on `heading`, out to `rangeM`.
 */
export function coveragePolygon(ap: AccessPoint): LatLng[] {
  if (ap.heading === null || ap.fov === null || ap.rangeM === null) return [];
  const half = ap.fov / 2;
  const start = ap.heading - half;
  const steps = Math.max(6, Math.round(ap.fov / 10));
  const points: LatLng[] = [[ap.lat, ap.lng]];
  for (let i = 0; i <= steps; i++) {
    const bearing = start + (ap.fov * i) / steps;
    points.push(destinationPoint(ap.lat, ap.lng, bearing, ap.rangeM));
  }
  return points;
}

/** Linear interpolation between two points at fraction t (0–1). Fine for short demo routes. */
export function interpolate(from: LatLng, to: LatLng, t: number): LatLng {
  const clamped = Math.max(0, Math.min(1, t));
  return [from[0] + (to[0] - from[0]) * clamped, from[1] + (to[1] - from[1]) * clamped];
}

/** Bounding box [[south,west],[north,east]] covering all access points. */
export function boundsOf(points: AccessPoint[]): [LatLng, LatLng] | null {
  if (points.length === 0) return null;
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
