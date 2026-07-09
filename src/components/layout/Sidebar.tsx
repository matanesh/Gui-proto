import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  ListChecks,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch,
  PlayCircle,
  Radio,
  Settings,
  TerminalSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";
import { APP_NAME } from "@/config/app";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/commands", label: "Commands", icon: TerminalSquare, end: false },
  { to: "/runs", label: "Runs", icon: ListChecks, end: false },
  { to: "/map", label: "Fleet Map", icon: Map, end: false },
  { to: "/scenarios", label: "Scenarios", icon: PlayCircle, end: false },
  { to: "/events", label: "Event Stream", icon: Radio, end: false },
  { to: "/timeline", label: "Timeline", icon: GitBranch, end: false },
  { to: "/health", label: "System Health", icon: Activity, end: false },
  { to: "/config", label: "Configuration", icon: Settings, end: false },
] as const;

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r bg-card/50 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className={cn("flex h-14 items-center border-b px-3", collapsed && "justify-center")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
            <TerminalSquare className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full justify-start gap-3 text-muted-foreground", collapsed && "justify-center")}
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
