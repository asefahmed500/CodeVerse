
'use client'

import { useMemo } from 'react'
import { X, SplitSquareHorizontal } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { useRouter } from 'next/navigation'
import type { FileType } from '@/types'
import { FileIcon } from './file-icon'
import { Button } from '../ui/button'

export function EditorTabs() {
  const { allFiles, closeFile, activeFileId, setActiveFileId } = useFileSystem()
  const router = useRouter()

  const openFiles = useMemo(() => {
    return allFiles
      .filter(f => !f.isFolder && f.isOpen)
      // Sort by most recently updated to keep the tab order stable but recent
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allFiles])

  const handleCloseTab = (e: React.MouseEvent, fileToClose: FileType) => {
    e.stopPropagation()

    const remainingOpenFiles = openFiles.filter(f => f._id !== fileToClose._id);
    let newActiveFileId: string | null = null;
    
    // If we're closing the active tab, we need to decide which tab to activate next.
    if (activeFileId === fileToClose._id) {
        if (remainingOpenFiles.length > 0) {
            // A good default is the most recently used file among the remaining open ones.
            // Since `openFiles` is already sorted by `updatedAt` desc, the first one is the best candidate.
            newActiveFileId = remainingOpenFiles[0]._id;
        }
        // If no other files are open, newActiveFileId remains null, and we go to the welcome screen.
    } else {
        // If we're closing a background tab, the active tab doesn't change.
        newActiveFileId = activeFileId;
    }

    closeFile(fileToClose._id, newActiveFileId);

    if (newActiveFileId) {
        router.push(`/editor/${newActiveFileId}`);
    } else {
        router.push('/editor');
    }
  }
  
  const handleTabClick = (file: FileType) => {
    if (file._id !== activeFileId) {
        setActiveFileId(file._id);
        router.push(`/editor/${file._id}`);
    }
  }

  if (openFiles.length === 0) return <div className="h-[40px] bg-card border-b"></div>

  return (
    <div className="flex items-center justify-between bg-card border-b h-[40px]">
      <div className="flex items-center overflow-x-auto">
        {openFiles.map((file) => (
          <div
            key={file._id}
            className={`flex-shrink-0 flex items-center px-3 h-[40px] text-sm border-r cursor-pointer group ${activeFileId === file._id ? 'bg-background text-foreground' : 'bg-card text-muted-foreground hover:bg-background'}`}
            onClick={() => handleTabClick(file)}
          >
            <FileIcon filename={file.name} className="h-4 w-4 mr-2" />
            <span className="mr-2 whitespace-nowrap">{file.name}</span>
            <button
              className={`p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground ${activeFileId === file._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => handleCloseTab(e, file)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
       <div className="flex items-center pr-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <SplitSquareHorizontal size={16} />
        </Button>
      </div>
    </div>
  )
}
