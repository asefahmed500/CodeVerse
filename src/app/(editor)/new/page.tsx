"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFileSystem } from "@/app/_hooks/use-file-system";
import { toast } from "sonner";

export default function NewFilePage() {
  const router = useRouter();
  const { createFile, loading } = useFileSystem();

  useEffect(() => {
    if (loading) return;
    
    let untitledCount = 1;
    // This logic should ideally be more robust, checking existing files
    const createNewFile = async () => {
      try {
        const newFile = await createFile(`Untitled-${untitledCount}`);
        router.replace(`/editor/${newFile._id}`);
      } catch (error) {
        toast.error("Failed to create new file");
        router.replace("/editor");
      }
    };

    createNewFile();
  }, [createFile, router, loading]);

  return (
    <div className="flex items-center justify-center flex-1 bg-[#1e1e1e] h-full">
      <p>Creating new file...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary ml-4"></div>
    </div>
  );
}
