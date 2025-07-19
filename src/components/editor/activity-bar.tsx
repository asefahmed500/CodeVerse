
"use client";

import React from "react";
import { Settings, type LucideIcon, Files, Search, Github, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveView, type ActiveView } from "@/hooks/use-active-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserButton } from "../auth/user-button";

interface ViewConfig {
  view: ActiveView;
  icon: LucideIcon;
  tooltip: string;
}

const activityItems: ViewConfig[] = [
    { view: "explorer", icon: Files, tooltip: "Explorer (Ctrl+Shift+E)" },
    { view: "search", icon: Search, tooltip: "Search (Ctrl+Shift+F)" },
    { view: "github", icon: Github, tooltip: "Source Control (Ctrl+Shift+G)" },
    { view: "debug", icon: Bug, tooltip: "Run and Debug (Ctrl+Shift+D)" },
];

const settingsItem: ViewConfig = {
    view: "settings",
    icon: Settings,
    tooltip: "Settings (Ctrl+,)",
};

const ActivityBarItem = React.memo(function ActivityBarItem({
  item,
  activeView,
  onToggle,
}: {
  item: ViewConfig
  activeView: ActiveView
  onToggle: (view: ActiveView) => void
}) {
  const handleToggle = React.useCallback(() => {
    onToggle(item.view);
  }, [onToggle, item.view])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-10 h-10 rounded-lg ${
            activeView === item.view
              ? "text-foreground bg-secondary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          onClick={handleToggle}
        >
          <item.icon className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{item.tooltip}</TooltipContent>
    </Tooltip>
  )
})
ActivityBarItem.displayName = "ActivityBarItem"

export function ActivityBar() {
  const { activeView, toggleActiveView } = useActiveView()

  return (
    <TooltipProvider>
      <div className="hidden md:flex flex-col items-center justify-between w-12 h-full bg-card border-r border-border py-2">
        <div className="flex flex-col items-center gap-2">
          {activityItems.map((item) => (
            <ActivityBarItem
              key={item.view}
              item={item}
              activeView={activeView}
              onToggle={toggleActiveView}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <UserButton />
          <ActivityBarItem
            item={settingsItem}
            activeView={activeView}
            onToggle={toggleActiveView}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
