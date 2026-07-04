import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Crosshair, Server, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicCommandForm } from "./DynamicCommandForm";
import { CommandResultPanel } from "./CommandResultPanel";
import { DockableMap } from "@/features/fleet/DockableMap";
import {
  buildTargetOptions,
  resolveTarget,
  type ResolvedTarget,
} from "@/features/fleet/targets";
import { useFleet } from "@/hooks/useFleet";
import { useCommands } from "@/hooks/useCommands";
import { useSubmitCommand } from "@/hooks/useRuns";
import { generateClientRequestId } from "@/lib/utils";
import type { CommandParameters } from "@/models";

export function CommandConsolePage() {
  const fleetQuery = useFleet();
  const commandsQuery = useCommands();
  const submit = useSubmitCommand();

  const [query, setQuery] = useState("");
  const [commandId, setCommandId] = useState<string | null>(null);
  const [active, setActive] = useState<{ runId: string; target: ResolvedTarget } | null>(null);

  const fleet = fleetQuery.data;
  const options = useMemo(() => (fleet ? buildTargetOptions(fleet) : []), [fleet]);
  const resolved = useMemo(() => (fleet ? resolveTarget(query, fleet) : null), [fleet, query]);
  const commands = commandsQuery.data ?? [];
  const command = commands.find((c) => c.id === commandId) ?? null;

  const handleSubmit = (parameters: CommandParameters) => {
    if (!resolved) {
      toast.error("Enter a valid target IP, name, or id first.");
      return;
    }
    if (!command) return;
    submit.mutate(
      {
        commandId: command.id,
        parameters,
        requestedBy: "operator-01",
        clientRequestId: generateClientRequestId(),
        targetPcId: resolved.servingAp.id,
        targetDeviceId: resolved.kind === "device" ? resolved.id : undefined,
        targetLabel: `${resolved.name} (${resolved.ip})`,
      },
      {
        onSuccess: (ack) => {
          setActive({ runId: ack.runId, target: resolved });
          toast.success(`Command sent to ${resolved.name}`, {
            description: `${ack.runId} — accepted (202)`,
          });
        },
        onError: (error) =>
          toast.error("Send failed", {
            description: error instanceof Error ? error.message : "Unexpected error.",
          }),
      },
    );
  };

  const mapTarget = active?.target ?? resolved;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader
        title="Command Console"
        description="Target a PC or device by IP, choose a command, and watch the result and its location live."
      />

      {/* Command form */}
      <Card className="mb-4">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor="target-ip" className="text-xs text-muted-foreground">
                Target — device or AP (IP, name, or id)
              </Label>
              <div className="relative">
                <Crosshair className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target-ip"
                  list="console-targets"
                  className="pl-8 font-mono"
                  placeholder="10.10.2.13  or  Field-Phone-16"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <datalist id="console-targets">
                  {options.map((o) => (
                    <option key={`${o.kind}-${o.id}`} value={o.ip}>
                      {o.name} · {o.kind}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="w-56 space-y-1.5">
              <Label htmlFor="console-command" className="text-xs text-muted-foreground">
                Command
              </Label>
              <Select value={commandId ?? ""} onValueChange={setCommandId}>
                <SelectTrigger id="console-command">
                  <SelectValue placeholder="Select command" />
                </SelectTrigger>
                <SelectContent>
                  {commands.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resolution preview */}
          <div className="min-h-5 text-xs">
            {query.trim() === "" ? (
              <span className="text-muted-foreground">
                Enter an access point or device IP. Devices resolve to their servicing access point.
              </span>
            ) : resolved ? (
              <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                {resolved.kind === "device" ? (
                  <Smartphone className="h-3.5 w-3.5 text-foreground" />
                ) : (
                  <Server className="h-3.5 w-3.5 text-foreground" />
                )}
                <span className="font-medium text-foreground">{resolved.name}</span>
                <span className="font-mono">{resolved.ip}</span>
                {resolved.kind === "device" && (
                  <>
                    <span>· via {resolved.servingAp.name}</span>
                    <span>· {resolved.exactLocation ? "exact location" : "approximate area"}</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-status-error">No target matches “{query}”.</span>
            )}
          </div>

          {/* Parameters + send */}
          {command ? (
            <div className="border-t pt-4">
              <DynamicCommandForm
                command={command}
                submitting={submit.isPending}
                onSubmit={handleSubmit}
                submitLabel="Send command"
              />
            </div>
          ) : (
            <p className="border-t pt-4 text-sm text-muted-foreground">
              Select a command to configure its parameters and send.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Result (left) + map (right, dockable) */}
      <div className="flex min-h-0 flex-1 gap-4">
        <Card className="min-w-0 flex-1 overflow-hidden p-0">
          <CommandResultPanel runId={active?.runId ?? null} />
        </Card>
        <DockableMap target={mapTarget} />
      </div>
    </div>
  );
}
