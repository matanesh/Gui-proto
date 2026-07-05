/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Editable system name shown in the boot splash and sidebar. */
  readonly VITE_SYSTEM_NAME?: string;
  /** Optional shorter system name for tight spaces. */
  readonly VITE_SYSTEM_SHORT_NAME?: string;

  /** Map tile source: "google" | "osm" | "offline" (default "google"). */
  readonly VITE_MAP_TILE_SOURCE?: string;
  /** Tile URL template for the "offline" source, e.g. http://tiles.internal/{z}/{x}/{y}.png */
  readonly VITE_MAP_TILE_URL?: string;
  /** Fallback map center "lat,lng" (used only when the dataset is empty). */
  readonly VITE_MAP_CENTER?: string;
  /** Fallback map zoom. */
  readonly VITE_MAP_ZOOM?: string;

  /** API mode: "mock" (default) or "real" (talk to the FastAPI BFF). */
  readonly VITE_API_MODE?: string;
  /** Base URL of the real BFF, e.g. http://localhost:8000/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
