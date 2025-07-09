
"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveView } from "@/hooks/use-active-view";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { usePanelStore } from "@/hooks/use-panel-store";

const TerminalManager = dynamic(
  () => import("./terminal-manager").then((mod) => mod.TerminalManager),
  {
    ssr: false,
    loading: () => <p className="p-2 text-sm">Loading Terminal...</p>,
  }
);

export function Panel() {
  const { activeView, setActiveView } = useActiveView();
  const { isCollapsed, setCollapsed } = usePanelStore();

  const isTerminalActive = activeView === "terminal";

  // This effect now implements a simple, unidirectional data flow.
  // The panel's collapsed state is driven directly by whether the 'terminal' view is active.
  useEffect(() => {
    // If the terminal should be active but the panel is collapsed, open it.
    if (isTerminalActive && isCollapsed) {
      setCollapsed(false);
    }
    // If the terminal is not the active view and the panel is open, close it.
    else if (!isTerminalActive && !isCollapsed) {
      setCollapsed(true);
    }
  }, [isTerminalActive, isCollapsed, setCollapsed]);

  // This handler now controls the active view state, which in turn controls the panel's visibility.
  const handleTogglePanel = () => {
    if (isTerminalActive) {
      setActiveView(null); // If terminal is active, clicking the control should close it.
    } else {
      setActiveView("terminal"); // Otherwise, make the terminal the active view.
    }
  };
  
  const handleClosePanel = () => {
    setActiveView(null);
  }

  return (
    <div
      className={`flex flex-col border-t border-border transition-all duration-200 ease-in-out ${
        isCollapsed ? "h-8" : "h-64"
      }`}
    >
      <Tabs
        value={isTerminalActive ? "terminal" : ""}
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
              {isCollapsed ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
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

        {!isCollapsed && (
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
