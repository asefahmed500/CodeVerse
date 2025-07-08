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
import { IDE_MANUAL } from "@/config/manual";

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
      const setupWorkspace = async () => {
        const welcomeFile = await createFile(
          "welcome.ts",
          undefined,
          `// Welcome to CodeVerse!
// This is a fully client-side IDE running in your browser.

// 1. Create, edit, and run your code.
// 2. All files are saved locally in your browser's storage.
// 3. Clone public GitHub repos from the Source Control panel.

function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

greet("Developer");
`
        );
        await createFile("IDE_MANUAL.txt", undefined, IDE_MANUAL);

        if(welcomeFile) {
          router.replace(`/editor/${welcomeFile._id}`);
        }
      };
      setupWorkspace();
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
