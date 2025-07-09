"use client";

import { Bug, Play, SkipForward, Power } from "lucide-react";
import { useActiveView } from "@/hooks/use-active-view";
import { useDebugStore } from "@/hooks/use-debug-store";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEditorStore } from "@/hooks/use-editor-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from "./file-icon";

export function DebugView() {
  const { activeView, setActiveView } = useActiveView();
  const { isDebugging, isPaused, activeFile, variables, start, stop, step, continue: continueDebug } = useDebugStore();
  const { activeFile: currentEditorFile } = useFileSystem();
  const { breakpoints } = useEditorStore();

  const handleStartDebug = () => {
    if (!currentEditorFile || currentEditorFile.isFolder) {
      toast.error("Please open a file to start debugging.");
      return;
    }
    const fileBreakpoints = breakpoints[currentEditorFile._id] || [];
    start(currentEditorFile, fileBreakpoints);
    setActiveView('debug');
  };

  if (activeView !== "debug") return null;

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Run and Debug</h3>
        {!isDebugging && (
          <Button size="sm" onClick={handleStartDebug}>
            <Play className="h-4 w-4 mr-2" />
            Start Debugging
          </Button>
        )}
      </div>

      {isDebugging ? (
        <div className="flex flex-col h-full">
          <div className="p-2 bg-secondary/50 flex items-center justify-center gap-2 border-b border-border">
            <Button variant="ghost" size="icon" onClick={continueDebug} disabled={!isPaused} title="Continue (F5)">
              <Play className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={step} disabled={!isPaused} title="Step Over (F10)">
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={stop} title="Stop (Shift+F5)">
              <Power className="h-5 w-5 text-destructive" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={['variables', 'callstack', 'breakpoints']} className="w-full">
              <AccordionItem value="variables">
                <AccordionTrigger className="p-2 text-xs font-semibold">VARIABLES</AccordionTrigger>
                <AccordionContent className="px-2">
                  {Object.entries(variables).length > 0 ? (
                     <div className="font-mono text-xs space-y-1 pl-2">
                        {Object.entries(variables).map(([key, value]) => (
                            <div key={key} className="flex">
                                <span className="text-muted-foreground">{key}: </span>
                                <span className="ml-1 text-primary">{JSON.stringify(value)}</span>
                            </div>
                        ))}
                     </div>
                  ) : <p className="text-xs text-muted-foreground px-2">No variables in current scope.</p>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="callstack">
                <AccordionTrigger className="p-2 text-xs font-semibold">CALL STACK</AccordionTrigger>
                <AccordionContent className="px-2">
                  {isPaused && activeFile ? (
                    <div className="flex items-center gap-2 p-1 bg-accent/50 rounded-sm">
                      <FileIcon filename={activeFile.name} className="h-4 w-4" />
                      <span className="text-sm">{activeFile.name}</span>
                      <span className="text-xs text-muted-foreground">line {activeFile.content.split('\\n').length}</span>
                    </div>
                  ) : <p className="text-xs text-muted-foreground px-2">Not paused.</p>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="breakpoints">
                <AccordionTrigger className="p-2 text-xs font-semibold">BREAKPOINTS</AccordionTrigger>
                <AccordionContent className="px-2 space-y-1">
                    {Object.entries(breakpoints).map(([fileId, lines]) => {
                        const file = useFileSystem.getState().findFile(fileId);
                        if (!file || lines.length === 0) return null;
                        return (
                            <div key={fileId}>
                                <div className="text-sm font-medium flex items-center gap-2">
                                    <FileIcon filename={file.name} className="h-4 w-4" />
                                    <span>{file.name}</span>
                                </div>
                                <div className="pl-6 text-xs text-muted-foreground">
                                    {lines.sort((a,b) => a-b).map(line => <div key={line}>Line {line}</div>)}
                                </div>
                            </div>
                        );
                    })}
                     {Object.values(breakpoints).flat().length === 0 && <p className="text-xs text-muted-foreground px-2">No breakpoints set.</p>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Bug className="h-10 w-10 text-muted-foreground mb-4" />
          <h4 className="font-medium">Start Debugging</h4>
          <p className="text-sm text-muted-foreground">
            Open a file and click "Start Debugging" to begin a simulated debug session.
          </p>
        </div>
      )}
    </div>
  );
}
