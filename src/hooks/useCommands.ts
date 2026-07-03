import { useQuery } from "@tanstack/react-query";
import { fetchCommands } from "@/services/commandsApi";

export function useCommands() {
  return useQuery({
    queryKey: ["commands"],
    queryFn: fetchCommands,
    staleTime: 5 * 60_000, // the catalog changes rarely
  });
}
