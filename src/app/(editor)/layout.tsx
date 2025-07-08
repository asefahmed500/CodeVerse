import { auth } from "@/lib/auth";
import { ActivityBar } from "@/components/editor/activity-bar";
import { Panel } from "@/components/editor/panel";
import { StatusBar } from "@/components/editor/status-bar";
import { TitleBar } from "@/components/editor/title-bar";
import { FileSystemProvider } from "@/hooks/use-file-system";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { MobileSidebar } from "@/components/editor/mobile-sidebar";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <FileSystemProvider>
      <MobileSidebar />
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <TitleBar session={session} />
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
    </FileSystemProvider>
  );
}
