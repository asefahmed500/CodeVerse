
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveView } from "@/hooks/use-active-view";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const TerminalManager = dynamic(
  () => import("./terminal-manager").then((mod) => mod.TerminalManager),
  {
    ssr: false,
    loading: () => <p className="p-2 text-sm">Loading Terminal...</p>,
  }
);

export function Panel() {
  const { activeView, setActiveView, toggleActiveView } = useActiveView();

  const isPanelVisible = activeView === "terminal";

  const handleTogglePanel = () => {
    toggleActiveView("terminal");
  };
  
  const handleClosePanel = () => {
    if (activeView === 'terminal') {
      setActiveView(null);
    }
  }

  return (
    <div
      className={`flex flex-col border-t border-border transition-all duration-200 ease-in-out ${
        isPanelVisible ? "h-64" : "h-8"
      }`}
    >
      <Tabs
        value={isPanelVisible ? "terminal" : ""}
        className="flex flex-col h-full bg-card"
        onValueChange={(value) => {
            if (value === 'terminal') {
                setActiveView('terminal');
            }
        }}
      >
        <div className="flex items-center justify-between h-8 flex-shrink-0">
          <TabsList className="bg-transparent h-8 p-0">
            <TabsTrigger
              value="terminal"
              className="h-full text-xs rounded-none border-t-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground px-3"
              onClick={handleTogglePanel}
            >
              TERMINAL
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1 mr-2">
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
            <TabsContent value="terminal" className="h-full mt-0">
              <TerminalManager />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
