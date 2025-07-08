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
      const newFile = await createFile("Untitled.js");
      if (newFile) {
        router.replace(`/editor/${newFile._id}`);
      } else {
        router.replace('/editor');
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
