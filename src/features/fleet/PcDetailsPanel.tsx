import { Link } from "react-router-dom";
import { Cpu, MapPin, Radar, Server, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SendCommandDialog } from "./SendCommandDialog";
import { useRunsList } from "@/hooks/useRuns";
import { formatTimestamp, relativeTime } from "@/lib/utils";
import { hasCoverage } from "@/models";
import type { AccessPointWithDevices } from "@/models";

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "text-sm"}>{value}</dd>
    </div>
  );
}

export function PcDetailsPanel({
  accessPoint,
  onClose,
  onLaunched,
}: {
  accessPoint: AccessPointWithDevices;
  onClose: () => void;
  onLaunched?: (runId: string) => void;
}) {
  // Command history for this PC — same in-memory store as the Runs screen.
  const runsQuery = useRunsList({ targetPcId: accessPoint.id, pageSize: 50, sort: "createdAt:desc" });
  const runs = runsQuery.data?.items ?? [];
  const latest = runs[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="truncate font-semibold">{accessPoint.name}</h2>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{accessPoint.id}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Last command status */}
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Last command</p>
          {runsQuery.isLoading ? (
            <Skeleton className="mt-2 h-6 w-40" />
          ) : latest ? (
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={latest.status} />
              <Link to={`/runs/${latest.runId}`} className="font-mono text-xs text-primary hover:underline">
                {latest.runId}
              </Link>
              <span className="text-xs text-muted-foreground">{relativeTime(latest.createdAt)}</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No command has been applied yet.</p>
          )}
        </div>

        {/* Core fields */}
        <dl className="grid grid-cols-2 gap-3">
          <Field label="IP address" value={accessPoint.ip || "—"} mono />
          <Field label="Group" value={accessPoint.group ?? "—"} />
          <Field label="Latitude" value={accessPoint.lat.toFixed(5)} mono />
          <Field label="Longitude" value={accessPoint.lng.toFixed(5)} mono />
          <Field label="Device status" value={accessPoint.deviceStatus ?? "—"} />
        </dl>

        {/* Coverage */}
        {hasCoverage(accessPoint) && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Radar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Coverage</h3>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <Field label="Heading" value={`${accessPoint.heading}°`} mono />
              <Field label="Field of view" value={`${accessPoint.fov}°`} mono />
              <Field label="Range" value={`${accessPoint.rangeM} m`} mono />
            </dl>
          </div>
        )}

        {/* Extra / editable CSV columns */}
        {Object.keys(accessPoint.extra).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Additional fields</h3>
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(accessPoint.extra).map(([key, value]) => (
                <Field key={key} label={key} value={value} />
              ))}
            </dl>
          </div>
        )}

        {/* Connected devices */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Connected devices</h3>
            <Badge variant="secondary">{accessPoint.devices.length}</Badge>
          </div>
          {accessPoint.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No connected devices.</p>
          ) : (
            <ul className="space-y-1.5">
              {accessPoint.devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                  <span>
                    {d.name}
                    {d.type && <span className="ml-2 text-xs text-muted-foreground">{d.type}</span>}
                  </span>
                  {d.ip && <span className="font-mono text-xs text-muted-foreground">{d.ip}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Command history */}
        <div>
          <h3 className="mb-2 text-sm font-medium">Command history</h3>
          {runsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No previous commands for this access point.</p>
          ) : (
            <ul className="space-y-1.5">
              {runs.map((run) => (
                <li key={run.runId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={run.status} />
                      <span className="truncate text-sm">{run.commandName}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground" title={formatTimestamp(run.createdAt)}>
                      {run.runId} · {relativeTime(run.createdAt)}
                    </p>
                  </div>
                  <Link to={`/runs/${run.runId}`} className="shrink-0 text-xs text-primary hover:underline">
                    view
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <SendCommandDialog accessPoint={accessPoint} onLaunched={onLaunched} />
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          Sending a command creates a run tagged to this access point.
        </p>
      </div>
    </div>
  );
}
