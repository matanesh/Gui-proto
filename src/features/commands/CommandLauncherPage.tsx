import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, TerminalSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { DynamicCommandForm } from "./DynamicCommandForm";
import { useCommands } from "@/hooks/useCommands";
import { useSubmitCommand } from "@/hooks/useRuns";
import { cn, formatDuration, generateClientRequestId } from "@/lib/utils";
import type { CommandDefinition, CommandParameters } from "@/models";

export function CommandLauncherPage() {
  const navigate = useNavigate();
  const commandsQuery = useCommands();
  const submitMutation = useSubmitCommand();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commands = useMemo(() => commandsQuery.data ?? [], [commandsQuery.data]);
  const selected: CommandDefinition | null =
    commands.find((c) => c.id === selectedId) ?? commands[0] ?? null;

  const byCategory = useMemo(() => {
    const groups = new Map<string, CommandDefinition[]>();
    for (const command of commands) {
      const group = groups.get(command.category) ?? [];
      group.push(command);
      groups.set(command.category, group);
    }
    return [...groups.entries()];
  }, [commands]);

  const handleSubmit = (parameters: CommandParameters) => {
    if (!selected) return;
    submitMutation.mutate(
      {
        commandId: selected.id,
        parameters,
        requestedBy: "operator-01",
        clientRequestId: generateClientRequestId(),
      },
      {
        onSuccess: (ack) => {
          toast.success(`Accepted (202) — ${ack.runId}`, {
            description: ack.message,
          });
          navigate(`/runs/${ack.runId}`);
        },
        onError: (error) => {
          toast.error("Submission failed", {
            description:
              error instanceof Error ? error.message : "Unexpected error. Retry is safe.",
          });
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Command Launcher"
        description="Select an operational command, review its parameters, and launch a run."
      />

      {commandsQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : commandsQuery.isError ? (
        <ErrorState onRetry={() => void commandsQuery.refetch()} />
      ) : commands.length === 0 ? (
        <EmptyState title="No commands available" icon={TerminalSquare} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Catalog */}
          <div className="space-y-6 lg:col-span-2">
            {byCategory.map(([category, categoryCommands]) => (
              <div key={category}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoryCommands.map((command) => (
                    <Card
                      key={command.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(command.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedId(command.id);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors hover:border-primary/50",
                        selected?.id === command.id && "border-primary bg-accent/40",
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">{command.name}</CardTitle>
                          <RiskBadge level={command.riskLevel} />
                        </div>
                        <CardDescription className="line-clamp-2">
                          {command.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{formatDuration(command.estimatedDurationSec)}
                        </span>
                        <Badge variant="secondary">{command.configurableFields.length} parameters</Badge>
                        {!command.enabled && <Badge variant="neutral">disabled</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Details + launch panel */}
          {selected && (
            <Card className="h-fit lg:sticky lg:top-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{selected.name}</CardTitle>
                  <RiskBadge level={selected.riskLevel} />
                </div>
                <CardDescription>{selected.description}</CardDescription>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Estimated duration: {formatDuration(selected.estimatedDurationSec)}
                  </span>
                  <span className="font-mono">{selected.id}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <DynamicCommandForm
                  command={selected}
                  submitting={submitMutation.isPending}
                  onSubmit={handleSubmit}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Submission uses the 202 Accepted pattern: the command is acknowledged with a
                  runId and executed asynchronously. You will be redirected to the live run view.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
