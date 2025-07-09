
"use client";

import { useActiveView, type ActiveView } from "@/hooks/use-active-view";
import { Explorer } from "./explorer";
import { SearchView } from "./search-view";
import { GitHubView } from "./github-view";
import { SettingsView } from "./settings-view";
import { DebugView } from "./debug-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allViews } from "@/config/views";

export function SidebarView() {
  const { activeView, openView } = useActiveView();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 border-b border-border md:hidden">
        <Select
          value={activeView || ""}
          onValueChange={(v) => openView(v as ActiveView)}
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
        <div hidden={activeView !== 'explorer'} className="h-full w-full">
          <Explorer />
        </div>
        <div hidden={activeView !== 'search'} className="h-full w-full">
          <SearchView />
        </div>
        <div hidden={activeView !== 'github'} className="h-full w-full">
          <GitHubView />
        </div>
        <div hidden={activeView !== 'debug'} className="h-full w-full">
          <DebugView />
        </div>
        <div hidden={activeView !== 'settings'} className="h-full w-full">
          <SettingsView />
        </div>
      </div>
    </div>
  );
}
