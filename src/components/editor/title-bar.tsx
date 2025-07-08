'use client';

import { useFileSystem } from '@/hooks/use-file-system';
import type { Session } from 'next-auth';
import { CommandPalette } from './command-palette';

export function TitleBar({ session }: { session: Session | null }) {
  const { activeFile } = useFileSystem();

  const title = activeFile
    ? `${activeFile.name} - CodeVerse`
    : 'CodeVerse';

  return (
    <>
    <div className="flex items-center justify-between h-8 bg-card text-foreground pl-2 drag-region border-b border-border">
      <div className="flex items-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
        </svg>

        <div className="flex items-center space-x-4 text-sm no-drag-region text-muted-foreground">
            <span>File</span>
            <span>Edit</span>
            <span>Selection</span>
            <span>View</span>
            <span>Go</span>
            <span>Run</span>
            <span>Terminal</span>
            <span>Help</span>
        </div>
      </div>
      <div className="flex-grow text-center drag-region">
        <span className="text-sm">{title}</span>
      </div>
      <div className="flex items-center no-drag-region pr-2">
        {/* Fake window controls */}
        <div className="w-3 h-3 rounded-full bg-red-500 mx-1"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 mx-1"></div>
        <div className="w-3 h-3 rounded-full bg-green-500 mx-1"></div>
      </div>
    </div>
    <CommandPalette />
    </>
  );
}
