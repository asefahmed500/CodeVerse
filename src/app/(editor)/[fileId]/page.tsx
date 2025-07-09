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

  // Find the file to render in the current state.
  // It might be null initially if the state hasn't updated yet.
  const fileToRender = findFile(fileId);

  useEffect(() => {
    // This effect's job is to sync the active file ID in the global state.
    // It should ONLY run when we are certain the file exists.
    if (fileToRender) {
      if (fileToRender.isFolder) {
        // Folders shouldn't have their own editor pages.
        // Redirect to the main editor view.
        router.replace('/editor');
        return;
      }
      setActiveFileId(fileId);
    }
    // We also listen to `allFiles` changing. If the file we are looking for appears, this effect will re-run.
  }, [fileId, fileToRender, router, setActiveFileId, allFiles]);


  // This is the new, robust loading guard.
  // It waits for the initial file system load to complete AND for the specific file to be available.
  // This solves the race condition where we navigate before the state has propagated.
  if (fileSystemLoading || !fileToRender) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4">Loading file...</p>
      </div>
    );
  }
  
  // This check is a final safeguard in case the useEffect redirect hasn't fired yet.
  if (fileToRender.isFolder) {
      return null;
  }

  // Render the editor only when we are sure we have a valid file.
  return (
      <CodeEditor file={fileToRender as FileType} key={fileToRender._id} />
  );
}
