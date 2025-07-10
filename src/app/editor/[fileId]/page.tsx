
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import { Editor } from "@/components/editor/editor";
import { toast } from "sonner";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="ml-4 text-lg">Loading File...</p>
    </div>
  );
}

export default function EditorFilePage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params?.fileId as string;

  const { findFile, setActiveFileId, loading: fsLoading } = useFileSystem();

  const file = findFile(fileId);

  useEffect(() => {
    if (fileId && file) {
      if (file.isFolder) {
        toast.error("Cannot open a folder in the editor.");
        router.replace('/editor');
      } else {
        setActiveFileId(fileId);
      }
    }
  }, [fileId, file, setActiveFileId, router]);

  if (fsLoading) {
    return <LoadingSpinner />;
  }
  
  if (!file) {
    // This can happen briefly on first load or if the fileId is invalid.
    // The parent layout will redirect if the user isn't logged in.
    return <LoadingSpinner />;
  }
  
  if (file.isFolder) {
    // This case is handled by the useEffect above, but as a safeguard:
    return null;
  }

  return <Editor initialFile={file} />;
}
