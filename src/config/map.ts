/**
 * Map configuration.
 *
 * The map engine is Leaflet (MIT) — no API key, works fully offline. The tile
 * SOURCE is swappable so the same code serves an internet demo and an isolated
 * network:
 *   - "google"  (default demo): Google raster tiles.
 *   - "osm":    OpenStreetMap raster tiles.
 *   - "offline": your internal / air-gapped tile server or bundled tiles,
 *                URL taken from VITE_MAP_TILE_URL (e.g. http://tiles.internal/{z}/{x}/{y}.png
 *                or a bundled /tiles/{z}/{x}/{y}.png).
 *
 * Switch without touching code:
 *   VITE_MAP_TILE_SOURCE=offline
 *   VITE_MAP_TILE_URL="http://tiles.internal/{z}/{x}/{y}.png"
 */

export type TileSourceId = "google" | "osm" | "offline";

export interface TileSource {
  id: TileSourceId;
  label: string;
  url: string;
  subdomains?: string[];
  attribution: string;
  maxZoom: number;
}

// Offline/internal tile URL — unknown until deployment; fill via env.
// Falls back to a bundled path that you can populate with an offline tile pyramid.
const OFFLINE_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL?.trim() || "/tiles/{z}/{x}/{y}.png";

export const TILE_SOURCES: Record<TileSourceId, TileSource> = {
  google: {
    id: "google",
    label: "Google",
    // Unofficial XYZ endpoint — fine for a prototype demo. For production use
    // your licensed source or an internal server (set source to "offline").
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    attribution: "© Google",
    maxZoom: 20,
  },
  osm: {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  offline: {
    id: "offline",
    label: "Offline / Internal",
    url: OFFLINE_TILE_URL,
    attribution: "Internal tile source",
    maxZoom: 18,
  },
};

function resolveSource(): TileSourceId {
  const raw = import.meta.env.VITE_MAP_TILE_SOURCE?.trim() as TileSourceId | undefined;
  return raw && raw in TILE_SOURCES ? raw : "google";
}

/** Active tile source, from VITE_MAP_TILE_SOURCE (default "google"). */
export const ACTIVE_TILE_SOURCE_ID: TileSourceId = resolveSource();

/** Fallback map view if the dataset is empty (else the map fits to the data). */
export const MAP_DEFAULT_CENTER: [number, number] = (() => {
  const raw = import.meta.env.VITE_MAP_CENTER?.split(",").map(Number);
  return raw && raw.length === 2 && raw.every((n) => !Number.isNaN(n))
    ? [raw[0]!, raw[1]!]
    : [32.0, 34.9];
})();

export const MAP_DEFAULT_ZOOM: number = Number(import.meta.env.VITE_MAP_ZOOM) || 7;
