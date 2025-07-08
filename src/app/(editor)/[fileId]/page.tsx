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
      if (file._id !== activeFileId) {
        if (!file.isFolder) {
            updateFile(file._id, { isOpen: true, isActive: true });
        } else {
            setActiveFileId(file._id);
        }
      }
    } else {
      if (fileId !== 'new' && files.length > 0) {
        // If file not found and it's not the 'new' route, redirect.
        const firstFile = files.find(f => !f.isFolder);
        router.push(firstFile ? `/editor/${firstFile._id}` : '/editor');
      } else if (files.length === 0) {
        router.push('/editor');
      }
    }
  }, [fileId, files, loading, router, findFile, updateFile, activeFileId, setActiveFileId]);
  
  const activeFile = findFile(activeFileId || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
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
        {activeFile && !activeFile.isFolder ? (
          <CodeEditor file={activeFile} key={activeFile._id} />
        ) : (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium text-foreground">
                Welcome to CodeVerse
              </h3>
              <p className="text-sm text-muted-foreground">
                Select a file from the explorer to start editing or create a new one.
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
