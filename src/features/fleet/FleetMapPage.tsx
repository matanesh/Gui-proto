import { useCallback, useMemo, useState } from "react";
import { MousePointerClick, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { MapView } from "./MapView";
import { PcDetailsPanel } from "./PcDetailsPanel";
import { UploadFleetDialog } from "./UploadFleetDialog";
import { CommandConsole } from "./CommandConsole";
import { CommandResultWindow } from "./CommandResultWindow";
import { accessPointTarget, type ResolvedTarget } from "./targets";
import { useFleet } from "@/hooks/useFleet";
import { useRunsList } from "@/hooks/useRuns";
import { ACTIVE_TILE_SOURCE_ID, TILE_SOURCES } from "@/config/map";
import type { AccessPointWithDevices, Run } from "@/models";

const LEGEND: Array<{ color: string; label: string }> = [
  { color: "#10b981", label: "Last cmd OK" },
  { color: "#3b82f6", label: "Cmd running" },
  { color: "#ef4444", label: "Failed / offline" },
  { color: "#22d3ee", label: "Online, no cmd" },
  { color: "#f59e0b", label: "Degraded" },
];

export function FleetMapPage() {
  const fleetQuery = useFleet();
  // One query feeds the marker colors; newest run per PC wins.
  const runsQuery = useRunsList({ pageSize: 500, sort: "createdAt:desc" });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [expandedCoverage, setExpandedCoverage] = useState<Set<string>>(new Set());
  const [activeCommand, setActiveCommand] = useState<{ runId: string; target: ResolvedTarget } | null>(null);

  const toggleCoverage = useCallback((id: string) => {
    setExpandedCoverage((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const accessPoints = useMemo(() => fleetQuery.data?.accessPoints ?? [], [fleetQuery.data]);
  const devicesByParent = useMemo(() => fleetQuery.data?.devicesByParent ?? {}, [fleetQuery.data]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    accessPoints.forEach((ap) => ap.group && set.add(ap.group));
    return [...set].sort();
  }, [accessPoints]);

  const latestByPc = useMemo(() => {
    const map: Record<string, Run> = {};
    for (const run of runsQuery.data?.items ?? []) {
      if (run.targetPcId && !map[run.targetPcId]) map[run.targetPcId] = run;
    }
    return map;
  }, [runsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accessPoints.filter((ap) => {
      if (group !== "all" && ap.group !== group) return false;
      if (!q) return true;
      return (
        ap.name.toLowerCase().includes(q) ||
        ap.ip.toLowerCase().includes(q) ||
        ap.id.toLowerCase().includes(q)
      );
    });
  }, [accessPoints, search, group]);

  const selected: AccessPointWithDevices | null = useMemo(() => {
    const ap = accessPoints.find((a) => a.id === selectedId);
    return ap ? { ...ap, devices: devicesByParent[ap.id] ?? [] } : null;
  }, [accessPoints, devicesByParent, selectedId]);

  const tile = TILE_SOURCES[ACTIVE_TILE_SOURCE_ID];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader
        title="Fleet Map"
        description="Access points across the network. Click a marker for details, connected devices, and command history."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" title="Configurable via VITE_MAP_TILE_SOURCE / VITE_MAP_TILE_URL">
              Tiles: {tile.label}
            </Badge>
            <UploadFleetDialog />
          </div>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card/40 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, IP, or id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5" />
          Double-click a marker for coverage
        </span>
        <Badge variant="outline">
          {filtered.length} / {accessPoints.length} shown
        </Badge>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Command console */}
      <Card className="mb-4 p-3">
        <CommandConsole
          compact
          onLaunched={(runId, target) => setActiveCommand({ runId, target })}
        />
      </Card>

      {/* Map + details */}
      {fleetQuery.isError ? (
        <ErrorState
          title="Could not load fleet data"
          message="Failed to read the access-point CSVs from /data. Check the files exist."
          onRetry={() => void fleetQuery.refetch()}
        />
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          <Card className="min-w-0 flex-1 overflow-hidden p-0">
            {fleetQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <MapView
                points={filtered}
                allPoints={accessPoints}
                latestByPc={latestByPc}
                selectedId={selectedId}
                expandedCoverage={expandedCoverage}
                onSelect={setSelectedId}
                onToggleCoverage={toggleCoverage}
              />
            )}
          </Card>

          {selected && (
            <Card className="w-96 shrink-0 overflow-hidden p-0">
              <PcDetailsPanel
                accessPoint={selected}
                onClose={() => setSelectedId(null)}
                onLaunched={(runId) =>
                  setActiveCommand({ runId, target: accessPointTarget(selected) })
                }
              />
            </Card>
          )}
        </div>
      )}

      {activeCommand && (
        <CommandResultWindow
          runId={activeCommand.runId}
          target={activeCommand.target}
          onClose={() => setActiveCommand(null)}
        />
      )}
    </div>
  );
}
