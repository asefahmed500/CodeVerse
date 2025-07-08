import { ActivityBar } from "@/components/editor/activity-bar";
import { Panel } from "@/components/editor/panel";
import { StatusBar } from "@/components/editor/status-bar";
import { TitleBar } from "@/components/editor/title-bar";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { MobileSidebar } from "@/components/editor/mobile-sidebar";
import { KeyboardShortcuts } from "@/components/editor/keyboard-shortcuts";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KeyboardShortcuts />
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
