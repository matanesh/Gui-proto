import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommandRequest, RunsFilter } from "@/models";
import { cancelRun, fetchRun, fetchRuns, submitCommand } from "@/services/runsApi";

export function useRunsList(filter: RunsFilter) {
  return useQuery({
    queryKey: ["runs", filter],
    queryFn: () => fetchRuns(filter),
    placeholderData: (prev) => prev, // keep table stable while filters change
  });
}

export function useRun(runId: string | undefined, options?: { refetchIntervalMs?: number | false }) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => fetchRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: options?.refetchIntervalMs ?? false,
  });
}

export function useSubmitCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CommandRequest) => submitCommand(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function useCancelRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => cancelRun(runId),
    onSuccess: (_data, runId) => {
      void queryClient.invalidateQueries({ queryKey: ["run", runId] });
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}
