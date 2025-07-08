"use client";

import { ActivityBar } from "@/components/editor/activity-bar";
import { Panel } from "@/components/editor/panel";
import { StatusBar } from "@/components/editor/status-bar";
import { TitleBar } from "@/components/editor/title-bar";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { MobileSidebar } from "@/components/editor/mobile-sidebar";
import { KeyboardShortcuts } from "@/components/editor/keyboard-shortcuts";
import { CommandPalette } from "@/components/editor/command-palette";
import { useEffect, useState } from "react";
import { useFileSystem } from "@/hooks/use-file-system";
import { useTerminalManager } from "@/hooks/use-terminal-manager-store";
import { useRouter } from "next/navigation";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Wait for zustand stores to rehydrate
  useEffect(() => {
    Promise.all([
      useFileSystem.persist.rehydrate(),
      useTerminalManager.persist.rehydrate(),
    ]).then(() => {
      setIsHydrated(true);
    });
  }, []);

  // Initialize with a default file if the store is empty after hydration
  useEffect(() => {
    if (isHydrated && useFileSystem.getState().files.length === 0) {
      const { createFile } = useFileSystem.getState();
      createFile(
        "welcome.js",
        undefined,
        `// Welcome to CodeVerse!
// Create, edit, and run your code.
// All files are saved locally in your browser.

function greet() {
  console.log("Hello, World!");
}

greet();
`
      ).then(newFile => {
        if(newFile) router.replace(`/editor/${newFile._id}`);
      });
    }
  }, [isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <KeyboardShortcuts />
      <CommandPalette />
      <MobileSidebar />
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <ActivityBar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <EditorTabs />
            {children}
          </div>
        </div>
        <Panel />
        <StatusBar />
      </div>
    </>
  );
}
