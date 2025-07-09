"use client";

import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEffect } from "react";
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
  const { findFile, setActiveFileId, loading: fileSystemLoading, allFiles } = useFileSystem();

  const fileToRender = findFile(fileId);

  useEffect(() => {
    // Rely on allFiles dependency to re-run this effect when the file list changes.
    if (fileSystemLoading) return;

    const file = findFile(fileId);
    if (file) {
      if (file.isFolder) {
        // If a folder is selected, it's better to go to the editor's root view.
        router.replace('/editor');
        return;
      }
      setActiveFileId(fileId);
    } else {
      // If the file isn't found after loading, it might be a true 404
      // or the state hasn't propagated yet. The loading guard below handles the latter.
      // If it's still not found after loading, redirect.
      if (!fileSystemLoading) {
         router.replace('/editor');
      }
    }
  }, [fileId, fileSystemLoading, findFile, router, setActiveFileId, allFiles]);

  // This is the main loading guard. It waits for both the file system to be loaded
  // AND for the specific file to be available in the state. This fixes the race condition.
  if (fileSystemLoading || !fileToRender) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4">Loading file...</p>
      </div>
    );
  }
  
  // This check is a safeguard in case the useEffect hasn't redirected yet.
  if (fileToRender.isFolder) {
      return null;
  }

  return (
      <CodeEditor file={fileToRender as FileType} key={fileToRender._id} />
  );
}
