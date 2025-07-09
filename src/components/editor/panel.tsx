
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, X, TerminalSquare, MessageSquareWarning, Sparkles, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { ExplainView } from "./explain-view";
import { FixView } from "./fix-view";

const TerminalManager = dynamic(
  () => import("./terminal-manager").then((mod) => mod.TerminalManager),
  {
    ssr: false,
    loading: () => <p className="p-2 text-sm">Loading Terminal...</p>,
  }
);

export function Panel() {
  const [activeTab, setActiveTab] = useState<string | null>("terminal");
  const [isCollapsed, setCollapsed] = useState(false);

  const handleTabChange = (value: string) => {
    if (isCollapsed) {
      setCollapsed(false);
      setActiveTab(value);
    } else if (activeTab === value) {
      setCollapsed(true);
    } else {
      setActiveTab(value);
    }
  };

  const handleTogglePanel = () => {
    setCollapsed(!isCollapsed);
  };
  
  const handleClosePanel = () => {
    setCollapsed(true);
  }

  const isPanelVisible = !isCollapsed;

  return (
    <div
      className={`flex flex-col border-t bg-card transition-all duration-200 ease-in-out ${
        isPanelVisible ? "h-64" : "h-8"
      }`}
    >
      <Tabs
        value={isPanelVisible ? activeTab || "" : ""}
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
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              className="h-full text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3 flex items-center gap-2"
            >
              <TerminalSquare className="h-4 w-4" /> Terminal
            </TabsTrigger>
             <TabsTrigger
              value="fix"
              className="h-full text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3 flex items-center gap-2"
            >
              <PencilRuler className="h-4 w-4" /> Fix & Refactor
            </TabsTrigger>
             <TabsTrigger
              value="explain"
              className="h-full text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Explain
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
            <TabsContent value="problems" className="h-full mt-0 p-4 text-sm text-muted-foreground">
              No problems have been detected.
            </TabsContent>
            <TabsContent value="terminal" className="h-full mt-0">
              <TerminalManager />
            </TabsContent>
             <TabsContent value="fix" className="h-full mt-0">
              <FixView />
            </TabsContent>
             <TabsContent value="explain" className="h-full mt-0">
              <ExplainView />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
