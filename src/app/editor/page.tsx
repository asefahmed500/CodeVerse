"use client";

import { useEffect } from "react";
import { useFileSystem } from "@/hooks/use-file-system";

export default function EditorPage() {
  const { setActiveFileId } = useFileSystem();

  // On load, ensure no file is active since we are at the root.
  useEffect(() => {
    setActiveFileId(null);
  }, [setActiveFileId]);

  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center p-4">
        <h3 className="text-lg font-medium text-foreground">
          Welcome to CodeVerse
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a file, or clone a repository to begin.
        </p>
      </div>
    </div>
  );
}
