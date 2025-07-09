'use client'

import { useMemo } from 'react'
import { X, SplitSquareHorizontal } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { useRouter } from 'next/navigation'
import type { FileType } from '@/types'
import { FileIcon } from './file-icon'
import { Button } from '../ui/button'

export function EditorTabs() {
  const { files, closeFile, activeFileId, setActiveFileId } = useFileSystem()
  const router = useRouter()

  const openFiles = useMemo(() => {
    const collected: FileType[] = []
    const findOpen = (fs: FileType[]) => {
      fs.forEach(f => {
        if (!f.isFolder && f.isOpen) {
          collected.push(f)
        }
        if (f.isFolder && f.children) {
          findOpen(f.children)
        }
      })
    }
    findOpen(files)
    return collected.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))
  }, [files])

  const handleCloseTab = (e: React.MouseEvent, fileToClose: FileType) => {
    e.stopPropagation()

    // Predict the next state before dispatching the update
    const remainingOpenFiles = openFiles.filter(f => f._id !== fileToClose._id);

    // Dispatch the state update
    closeFile(fileToClose._id)

    // Act on the predicted state
    if (activeFileId === fileToClose._id) {
      if (remainingOpenFiles.length > 0) {
        // The list is already sorted by most recently used
        const newActiveFile = remainingOpenFiles[0]
        setActiveFileId(newActiveFile._id)
        router.push(`/editor/${newActiveFile._id}`)
      } else {
        setActiveFileId(null)
        router.push('/editor')
      }
    }
  }
  
  const handleTabClick = (file: FileType) => {
    setActiveFileId(file._id);
    router.push(`/editor/${file._id}`);
  }

  if (openFiles.length === 0) return <div className="h-[40px] bg-card border-b"></div>

  return (
    <div className="flex items-center justify-between bg-card border-b h-[40px]">
      <div className="flex items-center">
        {openFiles.map((file) => (
          <div
            key={file._id}
            className={`flex items-center px-3 h-[40px] text-sm border-r cursor-pointer group ${activeFileId === file._id ? 'bg-background text-foreground' : 'bg-card text-muted-foreground hover:bg-background'}`}
            onClick={() => handleTabClick(file)}
          >
            <FileIcon filename={file.name} className="h-4 w-4 mr-2" />
            <span className="mr-2">{file.name}</span>
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
