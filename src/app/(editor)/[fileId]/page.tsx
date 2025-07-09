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
  const { findFile, setActiveFileId, loading: fileSystemLoading } = useFileSystem();

  const fileToRender = findFile(fileId);

  useEffect(() => {
    // This effect handles setting the active file and redirecting if necessary.
    if (fileToRender) {
      if (fileToRender.isFolder) {
        // If the route is for a folder, redirect to the editor root.
        router.replace('/editor');
        return;
      }
      // This will also mark it as open and active in the file system state.
      setActiveFileId(fileId);
    }
    // If the file is not found (fileToRender is null), we do nothing here.
    // The component will render a loading spinner, waiting for the file system
    // state to update (e.g., after a new file is created).
  }, [fileId, fileToRender, router, setActiveFileId]);

  // Render a spinner if the file system is still loading initially,
  // or if the specific file for this route hasn't been found in the state yet.
  if (fileSystemLoading || !fileToRender) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (fileToRender.isFolder) {
      // A final check before rendering the editor. This should be covered by the useEffect,
      // but it's good defensive programming.
      return (
        <div className="flex items-center justify-center flex-1 h-full bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
  }

  return (
      <CodeEditor file={fileToRender as FileType} key={fileToRender._id} />
  );
}
