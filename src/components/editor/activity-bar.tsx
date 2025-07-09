"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveView } from "@/hooks/use-active-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { activityItems } from "@/config/views";
import { UserButton } from "../auth/user-button";

export function ActivityBar() {
  const { activeView, toggleActiveView } = useActiveView();

  return (
    <TooltipProvider>
      <div className="hidden md:flex flex-col items-center justify-between w-12 h-full bg-card border-r border-border py-2">
        <div className="flex flex-col items-center gap-2">
            {activityItems.map((item) => (
                <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-10 h-10 rounded-lg ${activeView === item.view ? "text-foreground bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                        onClick={() => toggleActiveView(item.view)}
                    >
                        <item.icon className="h-6 w-6" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.tooltip}</TooltipContent>
                </Tooltip>
            ))}
        </div>

        <div className="flex flex-col items-center gap-2">
            <UserButton />
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`w-10 h-10 rounded-lg ${activeView === "settings" ? "text-foreground bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                    onClick={() => toggleActiveView("settings")}
                >
                    <Settings className="h-6 w-6" />
                </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings (Ctrl+,)</TooltipContent>
            </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
