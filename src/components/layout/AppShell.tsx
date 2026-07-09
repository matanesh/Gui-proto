import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FloatingAssistant } from "@/features/assistant/FloatingAssistant";
import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette />
      <FloatingAssistant />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
