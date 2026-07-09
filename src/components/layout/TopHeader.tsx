import { CircleUser, Radio, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/store/uiStore";

/**
 * Top header: global context strip. The status pill is a static mock at shell
 * level — per-screen data comes from the query hooks in each feature.
 */
export function TopHeader() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 overflow-hidden border-b bg-card/30 px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden truncate text-sm text-muted-foreground lg:inline">
          Internal operations console — prototype (mock data)
        </span>
        <Badge variant="outline" className="hidden shrink-0 lg:inline-flex">
          Sanitized Offline Demo
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search commands</span>
          <kbd className="hidden rounded border bg-muted px-1 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
        </button>
        <Badge variant="success" className="hidden gap-1.5 sm:inline-flex">
          <Radio className="h-3 w-3" />
          Systems nominal
        </Badge>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleUser className="h-5 w-5" />
          <span className="hidden font-mono text-xs md:inline">operator-01</span>
        </div>
      </div>
    </header>
  );
}
