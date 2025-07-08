'use client'

import { GitBranch, Check } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { getLanguageFromFilename } from '@/config/languages'
import { useEditorStore } from '@/hooks/use-editor-store'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
  
const StatusBarItem = ({ children, tooltip }: { children: React.ReactNode, tooltip: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center space-x-1 px-2 rounded hover:bg-white/10 cursor-pointer h-full">
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
    <div className="flex items-center justify-between h-6 px-2 md:px-4 text-xs bg-[#007acc] text-white flex-shrink-0">
      <div className="flex items-center h-full">
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
