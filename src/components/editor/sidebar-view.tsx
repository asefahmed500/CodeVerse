"use client";

import { useActiveView } from "@/hooks/use-active-view";
import { Explorer } from "./explorer";
import { SearchView } from "./search-view";
import { GitHubView } from "./github-view";
import { SettingsView } from "./settings-view";

export function SidebarView() {
  const { activeView } = useActiveView();

  return (
    <div className="h-full w-full">
      {activeView === 'explorer' && <Explorer />}
      {activeView === 'search' && <SearchView />}
      {activeView === 'github' && <GitHubView />}
      {activeView === 'settings' && <SettingsView />}
    </div>
  );
}
