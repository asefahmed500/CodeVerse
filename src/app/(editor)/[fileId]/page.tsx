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
    // This effect handles setting the active file and redirecting if the ID points to a folder.
    if (fileToRender) {
      if (fileToRender.isFolder) {
        // If the route is for a folder, it's not a valid editor page. Redirect.
        router.replace('/editor');
        return;
      }
      // If the file is valid, ensure it's marked as active in the global state.
      setActiveFileId(fileId);
    }
    // If fileToRender is null, we wait. The spinner below will be shown.
    // The component will re-render once the file system state updates.
  }, [fileId, fileToRender, router, setActiveFileId]);

  // Render a spinner if the file system is still loading initially,
  // or if the specific file for this route hasn't been found in the state yet.
  // This is key to preventing the 404 race condition.
  if (fileSystemLoading || !fileToRender) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // This check is a safeguard, but the useEffect should handle the redirect.
  if (fileToRender.isFolder) {
      return null;
  }

  return (
      <CodeEditor file={fileToRender as FileType} key={fileToRender._id} />
  );
}
