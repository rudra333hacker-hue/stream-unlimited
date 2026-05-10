import { Outlet } from "@tanstack/react-router";
import { SidebarNav } from "./SidebarNav";
import { BottomPlayer } from "./BottomPlayer";

export function AppShell() {
  return (
    <div className="h-screen w-full flex flex-col bg-black text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0 gap-2 p-2">
        <SidebarNav />
        <main
          className="flex-1 min-w-0 rounded-lg overflow-hidden flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.28 0.02 145 / 0.35) 0%, var(--color-background) 240px)",
          }}
        >
          <Outlet />
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
}
