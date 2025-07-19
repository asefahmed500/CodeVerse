
'use client'

import { GitBranch, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { getLanguageConfigFromFilename } from '@/config/languages'
import { useEditorStore } from '@/hooks/use-editor-store'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import React, { useEffect, useState } from 'react'
import { useProblemsStore } from '@/hooks/use-problems-store'
  
const StatusBarItem = ({ children, tooltip, className }: { children: React.ReactNode, tooltip: string, className?: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className={`flex items-center space-x-1 px-2 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer h-full ${className}`}>
                {children}
            </div>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
)

export function StatusBar() {
  const { activeFile, activeFileId, dirtyFileIds, savingFileIds, lastSavedFileId, lastSavedTime } = useFileSystem()
  const { cursorPosition } = useEditorStore()
  const { problems } = useProblemsStore();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (activeFileId && activeFileId === lastSavedFileId) {
        setShowSaved(true);
        const timer = setTimeout(() => {
            setShowSaved(false);
        }, 3000); // Show "Saved" for 3 seconds
        return () => clearTimeout(timer);
    }
  }, [lastSavedFileId, activeFileId, lastSavedTime]); // Trigger on every save

  const getFileStatus = () => {
    if (!activeFileId || !activeFile) return null;

    if (savingFileIds.includes(activeFileId)) {
      return { Icon: Clock, text: "Saving...", tooltip: "Saving file...", className: "text-muted-foreground animate-pulse" };
    }
    if (showSaved) {
       return { Icon: CheckCircle, text: "Saved", tooltip: `Last saved at ${new Date(lastSavedTime!).toLocaleTimeString()}`, className: "text-green-500" };
    }
    if (dirtyFileIds.includes(activeFileId)) {
      return { Icon: XCircle, text: "Unsaved", tooltip: "Unsaved changes", className: "text-yellow-500" };
    }
    return null;
  }

  const status = getFileStatus();

  return (
    <TooltipProvider>
    <div className="flex items-center justify-between h-6 px-2 text-xs bg-muted/50 text-muted-foreground border-t flex-shrink-0">
      <div className="flex items-center h-full">
         <StatusBarItem tooltip={problems.length > 0 ? `${problems.length} problems` : "No problems detected"}>
              {problems.length > 0 ? (
                <div className='flex items-center gap-1 text-destructive'>
                  <X size={14}/>
                  <span>{problems.length}</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 text-muted-foreground'>
                  <Check size={14} />
                  <span className='hidden sm:inline'>No Issues</span>
                </div>
              )}
          </StatusBarItem>
        <StatusBarItem tooltip="Source Control (main branch)">
            <GitBranch className="h-4 w-4" />
            <span>main</span>
        </StatusBarItem>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 h-full">
        {status && (
              <StatusBarItem tooltip={status.tooltip} className={status.className}>
                  <status.Icon className="h-4 w-4" />
                  <span className='hidden sm:inline'>{status.text}</span>
              </StatusBarItem>
        )}
        {cursorPosition && (
          <StatusBarItem tooltip="Go to Line/Column">
            <span>Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}</span>
          </StatusBarItem>
        )}
        {activeFile?.name && (
          <StatusBarItem tooltip="Select Language Mode">
            <span className='hidden sm:inline'>{getLanguageConfigFromFilename(activeFile.name).name}</span>
          </StatusBarItem>
        )}
        <StatusBarItem tooltip="Select Encoding">
            <span className='hidden sm:inline'>UTF-8</span>
        </StatusBarItem>
        <StatusBarItem tooltip="Select End of Line Sequence">
            <span className='hidden sm:inline'>LF</span>
        </StatusBarItem>
      </div>
    </div>
    </TooltipProvider>
  )
}
