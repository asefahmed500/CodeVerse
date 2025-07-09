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

  // Use the global state as the primary source of truth
  const { findFile, setActiveFileId, loading: fsLoading, fetchFiles } = useFileSystem();
  
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  // The file to render, read directly from the global store
  const file = findFile(fileId);

  useEffect(() => {
    if (!fileId) {
      router.replace('/editor');
      return;
    }

    let isMounted = true;

    const loadFile = async () => {
      // If the main file system is still performing its initial load, wait for it.
      if (fsLoading) {
        setStatus('loading');
        return;
      }

      // Fast path: If the file already exists in our global store, we're good to go.
      if (findFile(fileId)) {
        setStatus('success');
        return;
      }
      
      // Fallback path: If not in the store (e.g., hard refresh), fetch it from the API.
      setStatus('loading');
      try {
        const res = await fetch(`/api/files/${fileId}`);
        if (!isMounted) return;

        if (!res.ok) {
          throw new Error("File not found or could not be loaded.");
        }
        
        // We found a file, but our global store is out of sync.
        // Re-fetching the entire tree is the most reliable way to update the state.
        await fetchFiles();
        // After re-fetching, the next render will pick up the file from the store.
        setStatus('success');
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message);
          setStatus('error');
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
      if (file) {
          setActiveFileId(file._id);
          if (file.isFolder) {
            router.replace('/editor');
          }
      }
  }, [file, setActiveFileId, router]);


  // Render logic is now based on the unified status and file existence from the global store
  if (status === 'loading' || fsLoading || !file) {
    return <LoadingSpinner />;
  }
  
  if (status === 'error') {
    return (
        <div className="flex items-center justify-center h-full bg-background">
            <p className="text-lg text-destructive">Could not load the specified file.</p>
        </div>
    );
  }

  // At this point, we are certain that `file` is a valid FileType object and not a folder.
  return <Editor initialFile={file} />;
}
