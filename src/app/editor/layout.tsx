"use client";

import { ActivityBar } from "@/components/editor/activity-bar";
import { Panel } from "@/components/editor/panel";
import { StatusBar } from "@/components/editor/status-bar";
import { TitleBar } from "@/components/editor/title-bar";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { MobileSidebar } from "@/components/editor/mobile-sidebar";
import { KeyboardShortcuts } from "@/components/editor/keyboard-shortcuts";
import { CommandPalette } from "@/components/editor/command-palette";
import { useEffect } from "react";
import { useFileSystem } from "@/hooks/use-file-system";
import { useRouter } from "next/navigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SidebarView } from "@/components/editor/sidebar-view";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { useSession } from "next-auth/react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const { fetchFiles, loading } = useFileSystem();
  const router = useRouter();
  
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/signin');
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchFiles();
    }
  }, [status, fetchFiles]);


  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading Workspace...</p>
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
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="bg-card hidden md:block"
              collapsible={true}
              collapsed={isCollapsed ? true : undefined}
              onCollapse={() => setCollapsed(true)}
              onExpand={() => setCollapsed(false)}
            >
              <SidebarView />
            </ResizablePanel>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize={80}>
                <div className="flex flex-col h-full overflow-hidden">
                    <EditorTabs />
                    {children}
                </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <Panel />
        <StatusBar />
      </div>
    </>
  );
}
