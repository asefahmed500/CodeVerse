"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import type { FileType } from "@/types";
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
  
  // A single state to track the file loading process
  const [fileState, setFileState] = useState<{
    loading: boolean;
    file: FileType | null;
    error: string | null;
  }>({
    loading: true,
    file: null,
    error: null,
  });

  useEffect(() => {
    if (!fileId) {
      router.replace('/editor');
      return;
    }

    let isMounted = true;

    const loadFile = async () => {
      // Don't start fetching until the main file system is loaded
      if (fsLoading) {
        return;
      }

      setFileState({ loading: true, file: null, error: null });

      // Fast path: check local state first
      const localFile = findFile(fileId);
      if (localFile) {
        if (localFile.isFolder) {
            router.replace('/editor');
        } else {
            setFileState({ loading: false, file: localFile, error: null });
        }
        return;
      }
      
      // Fallback: fetch from API
      try {
        const res = await fetch(`/api/files/${fileId}`);
        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("File not found. It may have been deleted.");
          }
          throw new Error("Failed to load the file from the server.");
        }
        
        const data: FileType = await res.json();

        if (data.isFolder) {
            router.replace('/editor');
        } else {
            setFileState({ loading: false, file: data, error: null });
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message);
          setFileState({ loading: false, file: null, error: err.message });
          router.replace('/editor');
        }
      }
    };
    
    loadFile();

    return () => {
      isMounted = false;
    };
  }, [fileId, fsLoading, findFile, router]);
  
  // Effect to set the globally active file ID once it's loaded
  useEffect(() => {
      if (fileState.file) {
          setActiveFileId(fileState.file._id);
      }
  }, [fileState.file, setActiveFileId]);

  // Render based on state
  if (fileState.loading) {
    return <LoadingSpinner />;
  }
  
  if (fileState.error) {
    return (
        <div className="flex items-center justify-center h-full bg-background">
            <p className="text-lg text-destructive">{fileState.error}</p>
        </div>
    );
  }

  if (!fileState.file) {
    // This case should be handled by the redirect in the effect, but it's a good safeguard.
    return <LoadingSpinner />;
  }

  return <Editor initialFile={fileState.file} />;
}
