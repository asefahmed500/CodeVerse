
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, X, TerminalSquare, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useProblemsStore } from "@/hooks/use-problems-store";
import { useActiveView } from "@/hooks/use-active-view";

const TerminalManager = dynamic(
  () => import("./terminal-manager").then((mod) => mod.TerminalManager),
  {
    ssr: false,
    loading: () => <p className="p-2 text-sm">Loading Terminal...</p>,
  }
);

const ProblemsView = dynamic(
  () => import('./problems-view').then(mod => mod.ProblemsView),
  { ssr: false }
);


export function Panel() {
  const { problems } = useProblemsStore();
  const { activeView: activePanel, openView, toggleActiveView } = useActiveView();
  
  const isPanelVisible = ['problems', 'terminal'].includes(activePanel || '');

  const handleTabChange = (value: string) => {
    openView(value as any);
  };

  const handleTogglePanel = () => {
    if (isPanelVisible) {
        // If a panel is open, close it by setting view to explorer (or null)
        openView('explorer');
    } else {
        // If it's collapsed, open the terminal by default
        openView('terminal');
    }
  };
  
  const handleClosePanel = () => {
    openView('explorer'); // A safe default view to "close" the panel
  }

  return (
    <div
      className={`flex flex-col border-t bg-card transition-all duration-200 ease-in-out ${
        isPanelVisible ? "h-64" : "h-8"
      }`}
    >
      <Tabs
        value={isPanelVisible ? activePanel || "" : ""}
        className="flex flex-col h-full"
        onValueChange={handleTabChange}
      >
        <div className="flex items-center justify-between h-8 flex-shrink-0 px-2 border-b">
          <TabsList className="bg-transparent h-8 p-0">
            <TabsTrigger
              value="problems"
              className="h-full text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3 flex items-center gap-2"
            >
              <MessageSquareWarning className="h-4 w-4" /> Problems
              {problems.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold h-5 w-5 rounded-full bg-destructive text-destructive-foreground">
                  {problems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              className="h-full text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3 flex items-center gap-2"
            >
              <TerminalSquare className="h-4 w-4" /> Terminal
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground hover:bg-accent"
              onClick={handleTogglePanel}
            >
              {isPanelVisible ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground hover:bg-accent"
              onClick={handleClosePanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isPanelVisible && (
          <div className="flex-1 bg-background overflow-hidden">
            <TabsContent value="problems" className="h-full mt-0">
                <ProblemsView />
            </TabsContent>
            <TabsContent value="terminal" className="h-full mt-0">
              <TerminalManager />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
