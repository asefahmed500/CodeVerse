"use client";

import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SidebarView } from "@/components/editor/sidebar-view";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

export default function EditorFilePage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const router = useRouter();
  const { updateFile, findFile, loading } = useFileSystem();
  const { isCollapsed, setCollapsed } = useSidebarStore();

  // The primary source of truth for what to render is the fileId from the URL.
  const fileToRender = findFile(fileId);

  useEffect(() => {
    // Wait for the file system to be ready.
    if (loading) return;
    
    // Once loaded, check if the file from the URL exists.
    if (fileToRender) {
      // If it's a folder, we can't edit it, so redirect to the welcome screen.
      if (fileToRender.isFolder) {
        router.replace('/editor');
        return;
      }
      
      // If it's a valid file, ensure the global state reflects that it's open and active.
      // This keeps the UI (like tabs and explorer highlights) in sync.
      if (!fileToRender.isOpen || !fileToRender.isActive) {
        updateFile(fileId, { isOpen: true, isActive: true });
      }
    } else {
      // If the file doesn't exist at all, redirect to the welcome screen.
      router.replace('/editor');
    }
  }, [fileId, fileToRender, loading, router, updateFile]);

  // The loading screen is shown until the file system is loaded and we have a valid file to display.
  if (loading || !fileToRender || fileToRender.isFolder) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        <CodeEditor file={fileToRender} key={fileToRender._id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
