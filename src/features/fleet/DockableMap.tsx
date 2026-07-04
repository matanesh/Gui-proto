import { useCallback, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { MapPin, Move, PanelRightClose } from "lucide-react";
import { TargetMap } from "./TargetMap";
import type { ResolvedTarget } from "./targets";
import { cn } from "@/lib/utils";

const MIN_W = 320;
const MAX_W = 900;

/**
 * Target map that is docked to the right by default (resizable via its left
 * edge) and can pop out into a movable floating window ("Float") and back
 * ("Dock").
 */
export function DockableMap({ target }: { target: ResolvedTarget | null }) {
  const [floating, setFloating] = useState(false);
  const [width, setWidth] = useState(440);
  const dragging = useRef(false);

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startW = width;
      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        // Handle sits on the left edge: dragging left widens the panel.
        const next = startW + (startX - ev.clientX);
        setWidth(Math.min(MAX_W, Math.max(MIN_W, next)));
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width],
  );

  const body = target ? (
    <TargetMap target={target} />
  ) : (
    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
      Resolve a target to preview its location.
    </div>
  );

  const header = (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2",
        floating && "cmd-window-drag cursor-move",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{target ? target.name : "Target map"}</span>
      </span>
      <button
        onClick={() => setFloating((f) => !f)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        title={floating ? "Dock to the right" : "Float (movable window)"}
      >
        {floating ? <PanelRightClose className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
        {floating ? "Dock" : "Float"}
      </button>
    </div>
  );

  if (floating) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[80]">
        <Rnd
          default={{ x: Math.max(16, window.innerWidth - width - 40), y: 130, width, height: 440 }}
          minWidth={MIN_W}
          minHeight={280}
          bounds="parent"
          dragHandleClassName="cmd-window-drag"
          className="pointer-events-auto"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
            {header}
            <div className="min-h-0 flex-1">{body}</div>
          </div>
        </Rnd>
      </div>
    );
  }

  return (
    <div
      className="relative flex shrink-0 overflow-hidden rounded-lg border bg-card"
      style={{ width }}
    >
      <div
        onPointerDown={startResize}
        className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary/40"
        title="Drag to resize"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div className="min-h-0 flex-1">{body}</div>
      </div>
    </div>
  );
}
