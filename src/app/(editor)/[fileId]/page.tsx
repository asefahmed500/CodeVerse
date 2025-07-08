"use client";

import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/editor/code-editor";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { FileType } from "@/types";
import { SidebarView } from "@/components/editor/sidebar-view";

function findFileInTree(files: FileType[], fileId: string): FileType | null {
  for (const file of files) {
    if (file._id === fileId) {
      return file;
    }
    if (file.isFolder && file.children) {
      const found = findFileInTree(file.children, fileId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export default function EditorFilePage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const router = useRouter();
  const { files, updateFile, loading, activeFile, setActiveFile } = useFileSystem();

  useEffect(() => {
    if (loading) return;

    const file = findFileInTree(files, fileId);

    if (file) {
      if(file._id !== activeFile?._id) {
        if (!file.isFolder) {
          updateFile(file._id, { isOpen: true, isActive: true });
        } else {
          setActiveFile(file);
        }
      }
    } else {
      if (fileId !== 'new') {
        toast.error("File not found");
        router.push("/editor");
      }
    }
  }, [fileId, files, loading, router, setActiveFile, activeFile, updateFile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card">
        <SidebarView />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        {activeFile && !activeFile.isFolder ? (
          <CodeEditor file={activeFile} key={activeFile._id} />
        ) : (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground">
                Welcome to CodeVerse
              </h3>
              <p className="text-sm text-muted-foreground">
                Select a file from the explorer to start editing.
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
