"use client";

import { useParams, useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { FileType } from "@/types";

const Editor = dynamic(
  () => import("@/components/editor/editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4">Loading Editor...</p>
      </div>
    ),
  }
);

export default function EditorFilePage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const router = useRouter();
  const { findFile, setActiveFileId, loading: fileSystemLoading } = useFileSystem();
  
  const [file, setFile] = useState<FileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prioritize finding the file in the already-loaded global state
    const fileFromStore = findFile(fileId);
    if (fileFromStore) {
      setFile(fileFromStore);
      setIsLoading(false);
      return;
    }

    // If not found (e.g., hard refresh), fetch from the API.
    // We wait for the initial fileSystemLoading to be false before fetching,
    // to avoid a network request if the file is about to appear in the store.
    if (!fileSystemLoading) {
      const fetchFile = async () => {
        try {
          const res = await fetch(`/api/files/${fileId}`);
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error('File not found. It may have been deleted.');
            }
            throw new Error('Failed to load the file from the server.');
          }
          const data: FileType = await res.json();
          setFile(data);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFile();
    }
  }, [fileId, findFile, fileSystemLoading]);

  useEffect(() => {
    // Sync the active file ID in the global state once we have the file.
    if (file) {
      if (file.isFolder) {
        // Redirect if someone tries to open a folder in the editor
        router.replace('/editor');
        return;
      }
      setActiveFileId(file._id);
    }
  }, [file, setActiveFileId, router]);
  
  if (isLoading || fileSystemLoading && !file) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 mt-4">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full text-center bg-background p-4">
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => router.push('/editor')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Go to Editor
        </button>
      </div>
    );
  }
  
  if (!file) {
    // This can happen briefly before the redirect or if an unknown error occurs.
    return (
       <div className="flex flex-col items-center justify-center flex-1 h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 mt-4">Verifying file...</p>
      </div>
    )
  }

  if (file.isFolder) {
    return null; // Redirect is handled in useEffect
  }
  
  // Use initialFile prop for the Editor component.
  // The key ensures the editor remounts if the file ID changes.
  return <Editor initialFile={file} key={file._id} />;
}
