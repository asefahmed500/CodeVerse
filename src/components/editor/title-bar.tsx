'use client';

import { Play, Menu } from 'lucide-react';
import { useFileSystem } from '@/hooks/use-file-system';
import { Button } from '@/components/ui/button';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import { MainMenuBar } from './main-menu-bar';
import { useCodeRunner } from '@/hooks/use-code-runner';

export function TitleBar() {
  const { activeFileId, findFile } = useFileSystem();
  const { toggle: toggleMobileSidebar } = useMobileSidebar();
  const { runActiveFile } = useCodeRunner();
  
  const activeFile = findFile(activeFileId || '');

  const title = activeFile
    ? `${activeFile.name} - CodeVerse`
    : 'CodeVerse';
  
  const isRunnable = activeFile && !activeFile.isFolder;

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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground mr-2" onClick={runActiveFile} title="Run Code">
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
    </>
  );
}
