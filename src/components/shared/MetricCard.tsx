import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
}

export function MetricCard({ label, value, icon: Icon, hint, loading }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            )}
            {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
