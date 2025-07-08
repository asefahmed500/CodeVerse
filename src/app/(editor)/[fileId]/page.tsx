"use client";

import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import { useCallback, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SidebarView } from "@/components/editor/sidebar-view";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import dynamic from "next/dynamic";
import type { FileType } from "@/types";

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
  const { updateFile, findFile, loading, setActiveFileId } = useFileSystem();
  const { isCollapsed, setCollapsed } = useSidebarStore();

  const fileToRender = findFile(fileId);

  const syncFileState = useCallback(() => {
    if (fileToRender && (!fileToRender.isOpen || !fileToRender.isActive)) {
      updateFile(fileId, { isOpen: true, isActive: true });
    }
    setActiveFileId(fileId);
  }, [fileToRender, updateFile, fileId, setActiveFileId]);


  useEffect(() => {
    if (loading) return;
    
    if (fileToRender) {
      if (fileToRender.isFolder) {
        router.replace('/editor');
        return;
      }
      syncFileState();
    } else {
      // If the file doesn't exist in the store after loading, redirect.
      router.replace('/editor');
    }
  }, [fileId, fileToRender, loading, router, syncFileState]);

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
        <CodeEditor file={fileToRender as FileType} key={fileToRender._id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
