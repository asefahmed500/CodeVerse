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
    if (fileId) {
      setActiveFileId(fileId);
    }
  }, [fileId, setActiveFileId]);

  useEffect(() => {
    if (!fsLoading && file?.isFolder) {
      toast.error("Cannot open a folder in the editor.");
      router.replace('/editor');
    }
  }, [file, fsLoading, router]);

  if (fsLoading) {
    return <LoadingSpinner />;
  }
  
  if (!file) {
    return (
        <div className="flex items-center justify-center h-full bg-background">
            <p className="text-lg text-destructive">File not found.</p>
        </div>
    );
  }

  return <Editor initialFile={file} />;
}
