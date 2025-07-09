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

  const { findFile, setActiveFileId, loading: fsLoading, fetchFiles } = useFileSystem();
  
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
      // Don't start fetching until the main file system is loaded from the initial fetch
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
      
      // Fallback: fetch from API, as the local state might not be synced yet (e.g., hard refresh)
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
        
        // If we successfully fetch a file from the API, it means our local state is out of sync.
        // The most robust way to handle this is to re-fetch the entire file tree.
        // This ensures the new file and its potential siblings/parents are all correctly loaded.
        await fetchFiles();

        if (data.isFolder) {
            router.replace('/editor');
        } else {
            // After re-fetching, the file will be in the local state.
            // We set it here just to trigger the re-render.
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
  }, [fileId, fsLoading, findFile, router, fetchFiles]);
  
  useEffect(() => {
      if (fileState.file) {
          setActiveFileId(fileState.file._id);
      }
  }, [fileState.file, setActiveFileId]);

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
    // This case can happen briefly before redirect. A spinner is a good safeguard.
    return <LoadingSpinner />;
  }

  return <Editor initialFile={fileState.file} />;
}
