import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicCommandForm } from "@/features/commands/DynamicCommandForm";
import { useCommands } from "@/hooks/useCommands";
import { useSubmitCommand } from "@/hooks/useRuns";
import { generateClientRequestId } from "@/lib/utils";
import type { AccessPoint, CommandParameters } from "@/models";

interface SendCommandDialogProps {
  accessPoint: AccessPoint;
}

/**
 * Launch a command against a specific access point. Reuses the app's command
 * catalog, form, and run lifecycle — the only difference is `targetPcId`, which
 * ties the resulting run to this PC (surfaced in its history).
 */
export function SendCommandDialog({ accessPoint }: SendCommandDialogProps) {
  const [open, setOpen] = useState(false);
  const [commandId, setCommandId] = useState<string | null>(null);
  const commandsQuery = useCommands();
  const submitMutation = useSubmitCommand();
  const navigate = useNavigate();

  const commands = commandsQuery.data ?? [];
  const selected = commands.find((c) => c.id === commandId) ?? null;

  const handleSubmit = (parameters: CommandParameters) => {
    if (!selected) return;
    submitMutation.mutate(
      {
        commandId: selected.id,
        parameters,
        requestedBy: "operator-01",
        clientRequestId: generateClientRequestId(),
        targetPcId: accessPoint.id,
      },
      {
        onSuccess: (ack) => {
          toast.success(`Command sent to ${accessPoint.name}`, {
            description: `${ack.runId} — accepted (202). Opening run…`,
          });
          setOpen(false);
          navigate(`/runs/${ack.runId}`);
        },
        onError: (error) =>
          toast.error("Send failed", {
            description: error instanceof Error ? error.message : "Unexpected error.",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <Radio />
          Send command
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send command</DialogTitle>
          <DialogDescription>
            Target: <span className="font-medium text-foreground">{accessPoint.name}</span>{" "}
            <span className="font-mono text-xs">({accessPoint.ip})</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="fleet-command">Command</Label>
          <Select value={commandId ?? ""} onValueChange={setCommandId}>
            <SelectTrigger id="fleet-command">
              <SelectValue placeholder="Select a command" />
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

        {selected ? (
          <DynamicCommandForm
            command={selected}
            submitting={submitMutation.isPending}
            onSubmit={handleSubmit}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose a command to configure and launch it against this access point.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
