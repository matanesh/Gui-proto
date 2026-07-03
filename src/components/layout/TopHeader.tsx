import { CircleUser, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Top header: global context strip. The status pill is a static mock at shell
 * level — per-screen data comes from the query hooks in each feature.
 */
export function TopHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/30 px-5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Internal operations console — prototype (mock data)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="success" className="gap-1.5">
          <Radio className="h-3 w-3" />
          Systems nominal
        </Badge>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleUser className="h-5 w-5" />
          <span className="font-mono text-xs">operator-01</span>
        </div>
      </div>
    </header>
  );
}
