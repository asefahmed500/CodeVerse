'use client'

import { GitBranch, CircleDot, Check } from 'lucide-react'
import { useFileSystem } from '@/hooks/use-file-system'
import { getLanguageFromFilename } from '@/config/languages'

export function StatusBar() {
  const { activeFile } = useFileSystem()

  return (
    <div className="flex items-center justify-between h-6 px-2 md:px-4 text-xs bg-[#007acc] text-white flex-shrink-0">
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="flex items-center space-x-1">
          <GitBranch className="h-4 w-4" />
          <span>main</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        {activeFile?.name && (
          <span className='hidden sm:inline'>{getLanguageFromFilename(activeFile.name).toUpperCase()}</span>
        )}
        <span className='hidden sm:inline'>UTF-8</span>
        <span className='hidden sm:inline'>LF</span>
        <div className="flex items-center space-x-1">
          <Check className="h-4 w-4" />
          <span>Prettier</span>
        </div>
      </div>
    </div>
  )
}
