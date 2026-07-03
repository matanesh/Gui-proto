import type { HealthCheckEntry, HealthSnapshot } from "@/models";
import { simulateRequest } from "./apiClient";
import { buildHealthSnapshot, buildHealthTimeline } from "./mockData";

/** Mirrors GET /api/health. */
export async function fetchHealth(): Promise<HealthSnapshot> {
  return simulateRequest(() => buildHealthSnapshot(), { failRate: 0.04 });
}

/** Mock health-check timeline for the System Health screen. */
export async function fetchHealthTimeline(): Promise<HealthCheckEntry[]> {
  return simulateRequest(() => buildHealthTimeline(), { failRate: 0.04 });
}
