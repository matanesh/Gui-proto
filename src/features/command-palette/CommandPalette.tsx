import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";
import { useUiStore } from "@/store/uiStore";
import { PALETTE_ACTIONS } from "./actions";

/**
 * Global Ctrl/Cmd+K command palette. Actions run against live store state
 * (see actions.ts) rather than props, so this component can be mounted once
 * at the app root and stay decoupled from whatever page is active.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE_ACTIONS;
    return PALETTE_ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.keywords?.toLowerCase().includes(q),
    );
  }, [query]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, typeof PALETTE_ACTIONS>();
    for (const action of filtered) {
      if (!byGroup.has(action.group)) {
        byGroup.set(action.group, []);
        order.push(action.group);
      }
      byGroup.get(action.group)!.push(action);
    }
    return order.map((g) => ({ group: g, actions: byGroup.get(g)! }));
  }, [filtered]);

  function runAction(id: string) {
    const action = PALETTE_ACTIONS.find((a) => a.id === id);
    if (!action) return;
    action.run({ navigate, demo: useDemoStore.getState(), ui: useUiStore.getState() });
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[activeIndex];
      if (action) runAction(action.id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg gap-0 p-0" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No matching commands.</p>
          ) : (
            groups.map(({ group, actions }) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {actions.map((action) => {
                  const globalIndex = filtered.indexOf(action);
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => runAction(action.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                        globalIndex === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
