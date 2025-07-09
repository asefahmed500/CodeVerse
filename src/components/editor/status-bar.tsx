'use client'

import { GitBranch, Check, ShieldAlert, X } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { getLanguageFromFilename } from '@/config/languages'
import { useEditorStore } from '@/hooks/use-editor-store'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { Button } from '../ui/button'
  
const StatusBarItem = ({ children, tooltip }: { children: React.ReactNode, tooltip: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center space-x-1 px-2 rounded hover:bg-black/10 cursor-pointer h-full">
                {children}
            </div>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
)

export function StatusBar() {
  const { activeFile } = useFileSystem()
  const { cursorPosition } = useEditorStore()

  return (
    <TooltipProvider>
    <div className="flex items-center justify-between h-6 px-2 text-xs bg-muted/50 text-muted-foreground border-t flex-shrink-0">
      <div className="flex items-center h-full">
        <Button variant="destructive" size="sm" className="h-full rounded-none px-2 flex items-center gap-1 text-white">
          <X size={14}/>
          <span>2 Issues</span>
        </Button>
        <StatusBarItem tooltip="Source Control (main branch)">
            <GitBranch className="h-4 w-4" />
            <span>main</span>
        </StatusBarItem>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 h-full">
        {cursorPosition && (
          <StatusBarItem tooltip="Go to Line/Column">
            <span>Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}</span>
          </StatusBarItem>
        )}
        {activeFile?.name && (
          <StatusBarItem tooltip="Select Language Mode">
            <span className='hidden sm:inline'>{getLanguageFromFilename(activeFile.name).toUpperCase()}</span>
          </StatusBarItem>
        )}
        <StatusBarItem tooltip="Select Encoding">
            <span className='hidden sm:inline'>UTF-8</span>
        </StatusBarItem>
        <StatusBarItem tooltip="Select End of Line Sequence">
            <span className='hidden sm:inline'>LF</span>
        </StatusBarItem>
        <StatusBarItem tooltip="Configure Prettier">
          <Check className="h-4 w-4" />
          <span>Prettier</span>
        </StatusBarItem>
      </div>
    </div>
    </TooltipProvider>
  )
}
