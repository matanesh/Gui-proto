import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchHealthTimeline } from "@/services/healthApi";
import { useUiStore } from "@/store/uiStore";

export function useHealth() {
  const refreshIntervalSec = useUiStore((s) => s.refreshIntervalSec);
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: refreshIntervalSec > 0 ? refreshIntervalSec * 1000 : false,
  });
}

export function useHealthTimeline() {
  return useQuery({
    queryKey: ["health-timeline"],
    queryFn: fetchHealthTimeline,
  });
}
