import type {
  CommandAck,
  CommandDefinition,
  CommandRequest,
  HealthSnapshot,
  Run,
  RunsFilter,
  RunsPage,
} from "@/models";
import { httpGet, httpPost } from "./httpClient";

/** Real BFF adapters — mirror the mock service functions 1:1 (see docs/API_CONTRACT.md). */

export function realFetchCommands(): Promise<CommandDefinition[]> {
  return httpGet<{ items: CommandDefinition[] }>("/commands").then((r) => r.items);
}

export function realSubmitCommand(request: CommandRequest): Promise<CommandAck> {
  const { commandId, ...body } = request;
  return httpPost<CommandAck>(`/commands/${encodeURIComponent(commandId)}/runs`, body);
}

export function realFetchRuns(filter: RunsFilter = {}): Promise<RunsPage> {
  const q = new URLSearchParams();
  filter.status?.forEach((s) => q.append("status", s));
  if (filter.commandType) q.set("commandType", filter.commandType);
  if (filter.targetPcId) q.set("targetPcId", filter.targetPcId);
  if (filter.fromDate) q.set("fromDate", filter.fromDate);
  if (filter.toDate) q.set("toDate", filter.toDate);
  if (filter.search) q.set("search", filter.search);
  if (filter.page) q.set("page", String(filter.page));
  if (filter.pageSize) q.set("pageSize", String(filter.pageSize));
  if (filter.sort) q.set("sort", filter.sort);
  const qs = q.toString();
  return httpGet<RunsPage>(`/runs${qs ? `?${qs}` : ""}`);
}

export function realFetchRun(runId: string): Promise<Run> {
  return httpGet<Run>(`/runs/${encodeURIComponent(runId)}`);
}

export function realCancelRun(
  runId: string,
): Promise<{ runId: string; cancellationRequested: boolean; message: string }> {
  return httpPost(`/runs/${encodeURIComponent(runId)}/cancel`);
}

export function realFetchHealth(): Promise<HealthSnapshot> {
  return httpGet<HealthSnapshot>("/health");
}
