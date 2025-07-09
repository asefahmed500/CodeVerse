"use client";

import React from "react";
import { Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveView, type ActiveView } from "@/hooks/use-active-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { activityItems, type View } from "@/config/views";
import { UserButton } from "../auth/user-button";

// This memoized component is the core of the fix. By isolating the button
// and its tooltip, we prevent the parent's re-render from triggering a
// ref composition loop, which was the cause of the "Maximum update depth" error.
const ActivityBarItem = React.memo(function ActivityBarItem({ 
    item, 
    activeView, 
    onToggle 
}: { 
    item: View;
    activeView: ActiveView;
    onToggle: (view: ActiveView) => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-lg ${activeView === item.view ? "text-foreground bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                onClick={() => onToggle(item.view)}
            >
                <item.icon className="h-6 w-6" />
            </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.tooltip}</TooltipContent>
        </Tooltip>
    );
});

export function ActivityBar() {
  const { activeView, toggleActiveView } = useActiveView();

  const settingsItem: View = { view: "settings", icon: Settings, tooltip: "Settings (Ctrl+,)", label: "Settings" };

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
  );
}
