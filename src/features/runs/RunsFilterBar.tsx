import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommandDefinition, RunStatus } from "@/models";
import type { RunsHistoryFilters } from "@/store/uiStore";

const ALL_STATUSES: RunStatus[] = [
  "queued",
  "accepted",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "timeout",
];

interface RunsFilterBarProps {
  filters: RunsHistoryFilters;
  commands: CommandDefinition[];
  onChange: (patch: Partial<RunsHistoryFilters>) => void;
  onReset: () => void;
}

export function RunsFilterBar({ filters, commands, onChange, onReset }: RunsFilterBarProps) {
  const toggleStatus = (status: RunStatus) => {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onChange({ status: next });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.commandType !== "" ||
    filters.fromDate !== "" ||
    filters.toDate !== "" ||
    filters.search !== "";

  return (
    <div className="mb-4 space-y-3 rounded-lg border bg-card/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="run-search" className="text-xs text-muted-foreground">
            Search by run ID
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="run-search"
              className="pl-8"
              placeholder="run-2026…"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
            />
          </div>
        </div>

        <div className="w-48 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Command</Label>
          <Select
            value={filters.commandType || "all"}
            onValueChange={(v) => onChange({ commandType: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All commands</SelectItem>
              {commands.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40 space-y-1.5">
          <Label htmlFor="from-date" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            value={filters.fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value })}
          />
        </div>

        <div className="w-40 space-y-1.5">
          <Label htmlFor="to-date" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            value={filters.toDate}
            onChange={(e) => onChange({ toDate: e.target.value })}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Status:</span>
        {ALL_STATUSES.map((status) => {
          const active = filters.status.includes(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              aria-pressed={active}
            >
              <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
                {status}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
