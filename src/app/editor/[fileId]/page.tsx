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
  
  // Use undefined to represent the "not yet determined" state
  const [file, setFile] = useState<FileType | null | undefined>(() => fileId ? findFile(fileId) : undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
        router.replace('/editor');
        return;
    }

    let isMounted = true;
    
    // First, try to find the file in the already-loaded file system state.
    // This is the "fast path" for client-side navigation.
    const localFile = findFile(fileId);
    if (localFile) {
        if (localFile.isFolder) {
            router.replace('/editor');
        } else {
            setFile(localFile);
            setActiveFileId(fileId);
        }
        return; // Found it, no need to fetch
    }
    
    // If not in local state (e.g., on a hard refresh or if state isn't synced yet),
    // and the file system isn't loading, then fetch from the API.
    const fetchFile = async () => {
        try {
            const res = await fetch(`/api/files/${fileId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("File not found. It may have been deleted.");
                }
                throw new Error("Failed to fetch file from server.");
            }
            const data: FileType = await res.json();

            if (isMounted) {
                if (data.isFolder) {
                    router.replace('/editor');
                } else {
                    setFile(data);
                    setActiveFileId(fileId);
                }
            }
        } catch (err: any) {
            if (isMounted) {
                setError(err.message);
                toast.error(err.message);
                router.replace('/editor');
            }
        }
    };
    
    // Only fetch if the main file system has finished loading and we still haven't found the file.
    if (!fsLoading) {
        fetchFile();
    }

    return () => {
      isMounted = false;
    };
  }, [fileId, fsLoading, findFile, router, setActiveFileId]);

  // While file system is loading or we are fetching a file, show a spinner.
  // The `file === undefined` check handles the initial state before we decide to fetch.
  if (fsLoading || file === undefined) {
    return <LoadingSpinner />;
  }
  
  // If an error occurred during fetch.
  if (error) {
    return (
        <div className="flex items-center justify-center h-full bg-background">
            <p className="text-lg text-destructive">{error}</p>
        </div>
    );
  }

  // If file is null after trying everything (e.g., 404 from API).
  if (!file) {
    // The useEffect hook should have already redirected, but this is a safeguard.
    return <LoadingSpinner />;
  }

  // We have a valid file, render the editor.
  return <Editor initialFile={file} />;
}
