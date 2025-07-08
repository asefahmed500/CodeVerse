"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";

export default function NewFilePage() {
  const router = useRouter();
  const { createFile, loading } = useFileSystem();

  useEffect(() => {
    if (loading) return;

    const createNewUntitledFile = async () => {
      // The createFile hook now handles unique name generation and routing.
      const newFile = await createFile("Untitled");
      // If file creation fails, the hook shows a toast. We should redirect
      // the user back to the editor home to avoid being stuck on the "Creating..." page.
      if (!newFile) {
        router.replace("/editor");
      }
    };

    createNewUntitledFile();
  }, [createFile, loading, router]);

  return (
    <div className="flex items-center justify-center flex-1 bg-background h-full">
      <p>Creating new file...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary ml-4"></div>
    </div>
  );
}
