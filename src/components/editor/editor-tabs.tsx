'use client'

import { X } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { useRouter } from 'next/navigation'
import type { FileType } from '@/types'
import { FileIcon } from './file-icon'

export function EditorTabs() {
  const { files, updateFile, activeFile, setActiveFile } = useFileSystem()

  const openFiles = files.reduce((acc: FileType[], file: FileType) => {
    const findOpen = (f: FileType) => {
      if (!f.isFolder && f.isOpen) {
        acc.push(f)
      }
      if (f.isFolder && f.children) {
        f.children.forEach(findOpen)
      }
    }
    findOpen(file)
    return acc
  }, [])

  const router = useRouter()

  const handleCloseTab = (e: React.MouseEvent, fileToClose: FileType) => {
    e.stopPropagation()
    updateFile(fileToClose._id, { isOpen: false, isActive: false })

    if (activeFile?._id === fileToClose._id) {
      const remainingOpenFiles = openFiles.filter(f => f._id !== fileToClose._id)
      if (remainingOpenFiles.length > 0) {
        const newActiveFile = remainingOpenFiles[0]
        setActiveFile(newActiveFile)
        router.push(`/editor/${newActiveFile._id}`)
      } else {
        router.push('/editor')
      }
    }
  }

  if (openFiles.length === 0) return <div className="h-[36px] bg-muted border-b border-background"></div>

  return (
    <div className="flex items-center bg-muted border-b border-background">
      {openFiles.map((file) => (
        <div
          key={file._id}
          className={`flex items-center px-3 h-[36px] text-sm border-r border-background cursor-pointer group ${activeFile?._id === file._id ? 'bg-background text-foreground' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
          onClick={() => {
            setActiveFile(file)
            router.push(`/editor/${file._id}`)
          }}
        >
          <FileIcon filename={file.name} className="h-4 w-4 mr-2" />
          <span className="mr-2">{file.name}</span>
          <button
            className={`p-1 rounded-full text-muted-foreground hover:bg-card hover:text-foreground ${activeFile?._id === file._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => handleCloseTab(e, file)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
