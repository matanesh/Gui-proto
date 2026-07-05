/**
 * API mode switch. `mock` (default) uses the in-browser mock services; `real`
 * talks to the FastAPI BFF (see backend/). The service layer branches on this,
 * so components and hooks are identical in both modes.
 *
 *   VITE_API_MODE=real
 *   VITE_API_BASE_URL=http://localhost:8000/api
 */
export type ApiMode = "mock" | "real";

export const API_MODE: ApiMode =
  import.meta.env.VITE_API_MODE === "real" ? "real" : "mock";

export const IS_REAL = API_MODE === "real";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "http://localhost:8000/api");
