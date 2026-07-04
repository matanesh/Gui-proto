/**
 * Application-level configuration.
 *
 * The system name is editable in two ways:
 *  1. Set VITE_SYSTEM_NAME in a .env file (see .env.example) — preferred, no
 *     code change, injected at build/runtime by deployment configuration.
 *  2. Or change the fallback string below.
 */
export const APP_NAME: string =
  import.meta.env.VITE_SYSTEM_NAME?.trim() || "Ops Command Center";

/** Optional shorter label for tight spaces; falls back to APP_NAME. */
export const APP_SHORT_NAME: string =
  import.meta.env.VITE_SYSTEM_SHORT_NAME?.trim() || APP_NAME;
