import type { AccessPoint } from "@/models";

/**
 * Scenario map effects reference logical roles ("primary", "secondary",
 * "region-a", "route-a") rather than concrete access-point ids, so any
 * scenario can drive any Fleet Map dataset. This resolves those roles to
 * real markers from whatever CSV is currently loaded, deterministically
 * (sorted by id) so the same scenario always lights up the same markers
 * for a given dataset.
 */
export interface ScenarioMapBindings {
  primary: AccessPoint | null;
  secondary: AccessPoint | null;
  region: { group: string; members: AccessPoint[] } | null;
}

export function resolveMapBindings(accessPoints: AccessPoint[]): ScenarioMapBindings {
  const sorted = [...accessPoints].sort((a, b) => a.id.localeCompare(b.id));
  const primary = sorted[0] ?? null;
  const secondary = sorted[1] ?? null;
  const group = primary?.group ?? null;
  const region = group ? { group, members: accessPoints.filter((a) => a.group === group) } : null;
  return { primary, secondary, region };
}
