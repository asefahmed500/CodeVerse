'use client'

import { GitBranch, CircleDot, Check } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { getLanguageFromFilename } from '@/config/languages'

export function StatusBar() {
  const { activeFile } = useFileSystem()

  return (
    <div className="flex items-center justify-between h-6 px-4 text-xs bg-[#007acc] text-white">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <GitBranch className="h-4 w-4" />
          <span>main</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {activeFile?.name && (
          <span>{getLanguageFromFilename(activeFile.name).toUpperCase()}</span>
        )}
        <span>UTF-8</span>
        <span>LF</span>
        <div className="flex items-center space-x-1">
          <Check className="h-4 w-4" />
          <span>Prettier</span>
        </div>
      </div>
    </div>
  )
}
