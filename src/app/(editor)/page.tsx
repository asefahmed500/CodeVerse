"use client";

import { useEffect } from "react";
import { useFileSystem } from "@/hooks/use-file-system";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SidebarView } from "@/components/editor/sidebar-view";

export default function EditorPage() {
  const { setActiveFileId } = useFileSystem();
  const { isCollapsed, setCollapsed } = useSidebarStore();

  // On load, ensure no file is active since we are at the root.
  useEffect(() => {
    setActiveFileId(null);
  }, [setActiveFileId]);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={30}
        className="bg-card hidden md:block"
        collapsible={true}
        collapsed={isCollapsed ? true : undefined}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}
      >
        <SidebarView />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={80}>
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-4">
            <h3 className="text-lg font-medium text-foreground">
              Welcome to CodeVerse
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a file, or clone a repository to begin.
            </p>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
