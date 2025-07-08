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
  const { files, updateFile, findFile, activeFileId, setActiveFileId, loading } = useFileSystem();
  const { isCollapsed, setCollapsed } = useSidebarStore();

  useEffect(() => {
    if (loading) return;

    const file = findFile(fileId);

    if (file) {
      if (file.isFolder) {
        // Don't open folders in editor, just select in sidebar and redirect
        setActiveFileId(file._id);
        router.replace('/editor');
        return;
      }
      
      // If a valid file is found, make sure it's open and active.
      if (file._id !== activeFileId) {
        updateFile(file._id, { isOpen: true, isActive: true });
      }
    } else {
      // If file not found, redirect to the root editor page.
      router.replace('/editor');
    }
  }, [fileId, loading, router, findFile, updateFile, activeFileId, setActiveFileId, files]);
  
  const activeFile = findFile(activeFileId || '');

  if (loading || !activeFile || activeFile.isFolder || activeFileId !== fileId) {
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
        collapsed={isCollapsed || undefined}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}
      >
        <SidebarView />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={80}>
        <CodeEditor file={activeFile} key={activeFile._id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
