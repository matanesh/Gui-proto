import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Crosshair, Radio, Server, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFleet } from "@/hooks/useFleet";
import { useCommands } from "@/hooks/useCommands";
import { useSubmitCommand } from "@/hooks/useRuns";
import { buildDefaultParameters } from "@/features/commands/defaults";
import { generateClientRequestId } from "@/lib/utils";
import { buildTargetOptions, resolveTarget, type ResolvedTarget } from "./targets";

interface CommandConsoleProps {
  /** Called with the new runId + resolved target after a successful send. */
  onLaunched: (runId: string, target: ResolvedTarget) => void;
  compact?: boolean;
}

/**
 * Search a target by IP (or name/id) — an access point or a connected device
 * (phone/laptop) — pick a command, and send. The target resolves to the device
 * (with its servicing AP) or the AP itself.
 */
export function CommandConsole({ onLaunched, compact = false }: CommandConsoleProps) {
  const fleetQuery = useFleet();
  const commandsQuery = useCommands();
  const submit = useSubmitCommand();

  const [query, setQuery] = useState("");
  const [commandId, setCommandId] = useState<string | null>(null);

  const fleet = fleetQuery.data;
  const options = useMemo(() => (fleet ? buildTargetOptions(fleet) : []), [fleet]);
  const resolved = useMemo(() => (fleet ? resolveTarget(query, fleet) : null), [fleet, query]);
  const commands = commandsQuery.data ?? [];
  const command = commands.find((c) => c.id === commandId) ?? null;

  const canSend = Boolean(resolved && command) && !submit.isPending;

  const send = () => {
    if (!resolved || !command) return;
    submit.mutate(
      {
        commandId: command.id,
        parameters: buildDefaultParameters(command),
        requestedBy: "operator-01",
        clientRequestId: generateClientRequestId(),
        targetPcId: resolved.servingAp.id,
        targetDeviceId: resolved.kind === "device" ? resolved.id : undefined,
        targetLabel: `${resolved.name} (${resolved.ip})`,
      },
      {
        onSuccess: (ack) => {
          toast.success(`Command sent to ${resolved.name}`, { description: `${ack.runId} — accepted (202)` });
          onLaunched(ack.runId, resolved);
        },
        onError: (error) =>
          toast.error("Send failed", {
            description: error instanceof Error ? error.message : "Unexpected error.",
          }),
      },
    );
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-52 flex-1 space-y-1.5">
          <Label htmlFor="target-ip" className="text-xs text-muted-foreground">
            Target (IP, name, or id)
          </Label>
          <div className="relative">
            <Crosshair className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="target-ip"
              list="fleet-targets"
              className="pl-8 font-mono"
              placeholder="10.10.2.13 or Field-Phone-16"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <datalist id="fleet-targets">
              {options.map((o) => (
                <option key={`${o.kind}-${o.id}`} value={o.ip}>
                  {o.name} · {o.kind}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div className="w-52 space-y-1.5">
          <Label htmlFor="target-command" className="text-xs text-muted-foreground">
            Command
          </Label>
          <Select value={commandId ?? ""} onValueChange={setCommandId}>
            <SelectTrigger id="target-command">
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

        <Button onClick={send} disabled={!canSend}>
          <Radio />
          Send
        </Button>
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
    </div>
  );
}
