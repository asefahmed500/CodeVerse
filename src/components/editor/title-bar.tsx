'use client';

import { Play, Menu } from 'lucide-react';
import { useFileSystem } from '@/hooks/use-file-system';
import { useTerminalStore } from '@/hooks/use-terminal-store';
import { useActiveView } from '@/hooks/use-active-view';
import type { Session } from 'next-auth';
import { CommandPalette } from './command-palette';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import { MainMenuBar } from './main-menu-bar';

export function TitleBar({ session }: { session: Session | null }) {
  const { activeFile, getPathForFile } = useFileSystem();
  const { runCommand } = useTerminalStore();
  const { openView } = useActiveView();
  const { toggle: toggleMobileSidebar } = useMobileSidebar();

  const title = activeFile
    ? `${activeFile.name} - CodeVerse`
    : 'CodeVerse';
  
  const languageConfig = activeFile ? getLanguageConfigFromFilename(activeFile.name) : null;
  const isRunnable = activeFile && !activeFile.isFolder && languageConfig && languageConfig.judge0Id;

  const handleRun = () => {
    if (!activeFile || !languageConfig) return;

    const path = getPathForFile(activeFile._id);
    if (path) {
        openView('terminal');
        const command = languageConfig.runner || 'node';
        runCommand(`${command} ${path}`);
    } else {
        toast.error("Could not determine file path to run.");
    }
  }

  return (
    <>
    <div className="flex items-center justify-between h-8 bg-card text-foreground pl-2 drag-region border-b border-border flex-shrink-0">
      <div className="flex items-center no-drag-region">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground mr-1 md:hidden" onClick={toggleMobileSidebar}>
            <Menu size={16} />
        </Button>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
        </svg>

        <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
            <MainMenuBar />
        </div>
      </div>
      <div className="flex-grow text-center drag-region">
        <span className="text-sm">{title}</span>
      </div>
      <div className="flex items-center no-drag-region pr-2">
        {isRunnable && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground mr-2" onClick={handleRun} title="Run Code">
                <Play size={16} />
            </Button>
        )}
        <div className="hidden md:flex">
            <div className="w-3 h-3 rounded-full bg-red-500 mx-1"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 mx-1"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 mx-1"></div>
        </div>
      </div>
    </div>
    <CommandPalette />
    </>
  );
}
