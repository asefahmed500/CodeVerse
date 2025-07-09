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
      // If the file isn't found after loading, it's a true 404
      // You might want to redirect to a custom 404 page or the editor home
      router.replace('/editor');
    }
  }, [fileId, fileSystemLoading, findFile, router, setActiveFileId]);

  // This is the main loading guard. It waits for both the file system to be loaded
  // AND for the specific file to be available in the state.
  if (fileSystemLoading || !fileToRender) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
