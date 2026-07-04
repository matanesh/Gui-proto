import { useQuery } from "@tanstack/react-query";
import { fetchFleet } from "@/services/fleetApi";

export function useFleet() {
  return useQuery({
    queryKey: ["fleet"],
    queryFn: fetchFleet,
    staleTime: Infinity, // static per session unless a CSV is uploaded (then invalidated)
  });
}
