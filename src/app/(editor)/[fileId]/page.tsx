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
  const { updateFile, findFile, setActiveFileId } = useFileSystem();

  const fileToRender = findFile(fileId);

  useEffect(() => {
    if (fileToRender) {
      if (fileToRender.isFolder) {
        router.replace('/editor');
        return;
      }
      if (!fileToRender.isOpen || !fileToRender.isActive) {
        updateFile(fileId, { isOpen: true, isActive: true });
      }
      setActiveFileId(fileId);
    }
    // If the file is not found, we don't redirect. We let the component show a loading
    // spinner, and a subsequent re-render (after the file system store updates)
    // will provide the file. This prevents a race condition on file creation.
  }, [fileId, fileToRender, router, setActiveFileId, updateFile]);


  if (!fileToRender || fileToRender.isFolder) {
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
