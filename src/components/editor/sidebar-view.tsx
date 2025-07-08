"use client";

import { useActiveView, type ActiveView } from "@/hooks/use-active-view";
import { Explorer } from "./explorer";
import { SearchView } from "./search-view";
import { GitHubView } from "./github-view";
import { SettingsView } from "./settings-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allViews } from "@/config/views";

export function SidebarView() {
  const { activeView, setActiveView } = useActiveView();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 border-b border-border md:hidden">
        <Select
          value={activeView || ""}
          onValueChange={(v) => setActiveView(v as ActiveView)}
        >
          <SelectTrigger className="w-full bg-background border-input">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {allViews.map((item) => (
              <SelectItem key={item.view} value={item.view} className="focus:bg-accent">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0">
        {activeView === 'explorer' && <Explorer />}
        {activeView === 'search' && <SearchView />}
        {activeView === 'github' && <GitHubView />}
        {activeView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}
