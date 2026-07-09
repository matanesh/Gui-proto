import type { AssetStatus, RegionHealth } from "./scenario";

/** Scenario-driven overlay for a Fleet Map marker (resolved from a role). */
export interface MapAsset {
  id: string;
  role: string;
  status: AssetStatus;
}

/** Scenario-driven health overlay for a cluster of markers (an AP "group"). */
export interface MapRegion {
  id: string;
  role: string;
  health: RegionHealth;
}

/** An animated path between two resolved markers. */
export interface MapRoute {
  id: string;
  fromRole: string;
  toRole: string;
  progress: number;
  status: AssetStatus;
}
