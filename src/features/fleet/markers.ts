import L from "leaflet";
import type { AccessPoint, AssetStatus, Run, RunStatus } from "@/models";

/** Scenario-overlay colors — takes precedence over command/device-status colors. */
export const ASSET_STATUS_COLOR: Partial<Record<AssetStatus, string>> = {
  warning: "#f59e0b",
  degraded: "#f97316",
  failed: "#ef4444",
  completed: "#10b981",
};

/** Scenario overlay states that should pulse (draw attention) on the map. */
const PULSING_ASSET_STATUSES: ReadonlySet<AssetStatus> = new Set(["warning", "degraded", "failed"]);

export function isPulsingAssetStatus(status: AssetStatus | undefined): boolean {
  return status !== undefined && PULSING_ASSET_STATUSES.has(status);
}

// Fixed hex palette for map markers (map pins read better with solid colors
// than theme tokens). Mirrors the app status colors closely.
const COLORS = {
  running: "#3b82f6",
  succeeded: "#10b981",
  failed: "#ef4444",
  cancelled: "#64748b",
  online: "#22d3ee",
  degraded: "#f59e0b",
  offline: "#ef4444",
  unknown: "#64748b",
} as const;

const ACTIVE_STATUSES: RunStatus[] = ["running", "queued", "accepted"];

export function isActiveRun(run: Run | undefined): boolean {
  return run !== undefined && ACTIVE_STATUSES.includes(run.status);
}

/** Marker color: latest command outcome if any, else the device status. */
export function markerColor(ap: AccessPoint, latestRun?: Run): string {
  if (latestRun) {
    switch (latestRun.status) {
      case "running":
      case "queued":
      case "accepted":
        return COLORS.running;
      case "succeeded":
        return COLORS.succeeded;
      case "failed":
      case "timeout":
        return COLORS.failed;
      case "cancelled":
        return COLORS.cancelled;
    }
  }
  switch (ap.deviceStatus) {
    case "online":
      return COLORS.online;
    case "degraded":
      return COLORS.degraded;
    case "offline":
      return COLORS.offline;
    default:
      return COLORS.unknown;
  }
}

export function makeMarkerIcon(
  color: string,
  opts: { selected?: boolean; active?: boolean } = {},
): L.DivIcon {
  const classes = ["fleet-marker"];
  if (opts.selected) classes.push("fleet-marker--selected");
  if (opts.active) classes.push("fleet-marker--active");
  const size = opts.selected ? 22 : 16;
  return L.divIcon({
    className: "fleet-marker-wrap",
    html: `<span class="${classes.join(" ")}" style="--dot:${color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
