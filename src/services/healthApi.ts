import type { HealthCheckEntry, HealthSnapshot } from "@/models";
import { IS_REAL } from "@/config/api";
import { simulateRequest } from "./apiClient";
import { buildHealthSnapshot, buildHealthTimeline } from "./mockData";
import { realFetchHealth } from "./real/realApi";

/** Mirrors GET /api/health. */
export async function fetchHealth(): Promise<HealthSnapshot> {
  if (IS_REAL) return realFetchHealth();
  return simulateRequest(() => buildHealthSnapshot(), { failRate: 0.04 });
}

/** Mock health-check timeline for the System Health screen. */
export async function fetchHealthTimeline(): Promise<HealthCheckEntry[]> {
  return simulateRequest(() => buildHealthTimeline(), { failRate: 0.04 });
}
