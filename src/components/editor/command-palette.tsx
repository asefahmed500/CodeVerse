'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { useEffect, useState } from 'react'
import { File, Search, Settings, GitBranch, TerminalSquare, Github } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFileSystem } from '@/hooks/use-file-system'
import { useActiveView } from '@/hooks/use-active-view'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FileIcon } from './file-icon'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { files, createFile } = useFileSystem()
  const { setActiveView } = useActiveView()
  const { setTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const allFiles = files.reduce((acc: any[], file: any) => {
    const collectFiles = (f: any) => {
        if (!f.isFolder) acc.push(f)
        if (f.isFolder && f.children) f.children.forEach(collectFiles)
    }
    collectFiles(file)
    return acc
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#252526] border-[#3c3c3c] p-0 overflow-hidden shadow-2xl top-40">
          <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandPrimitive.Input 
              placeholder="Type a command or search..."
              className="w-full px-4 h-12 bg-transparent border-b border-[#3c3c3c] text-[#cccccc] outline-none placeholder:text-gray-500"
              autoFocus
            />
            <CommandPrimitive.List className="max-h-[400px] overflow-y-auto">
              <CommandPrimitive.Empty className="py-6 text-center text-sm text-[#858585]">
                No results found
              </CommandPrimitive.Empty>

              <CommandPrimitive.Group heading="File" className="text-[#cccccc] pt-2">
                <CommandPrimitive.Item 
                  onSelect={() => runCommand(() => createFile('Untitled'))}
                  className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc] text-[#cccccc]"
                >
                  <File className="w-4 h-4 mr-2" />
                  New File
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>

              <CommandPrimitive.Group heading="View" className="text-[#cccccc] pt-2">
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('explorer'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]">
                  <File className="w-4 h-4 mr-2" /> Show Explorer
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('search'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]">
                  <Search className="w-4 h-4 mr-2" /> Show Search
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('github'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]">
                  <Github className="w-4 h-4 mr-2" /> Show Source Control
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('terminal'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]">
                  <TerminalSquare className="w-4 h-4 mr-2" /> Show Terminal
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>

              <CommandPrimitive.Group heading="Preferences" className="text-[#cccccc] pt-2">
                <CommandPrimitive.Item 
                  onSelect={() => runCommand(() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark'))}
                  className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]">
                  <Settings className="w-4 h-4 mr-2" />
                  Toggle Color Theme
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>
              
              <CommandPrimitive.Group heading="Go to File" className="text-[#cccccc] pt-2">
                {allFiles.slice(0, 10).map((file) => (
                  <CommandPrimitive.Item 
                    key={file._id}
                    onSelect={() => runCommand(() => router.push(`/editor/${file._id}`))}
                    className="flex items-center p-2 rounded cursor-pointer hover:bg-[#007acc]"
                  >
                    <FileIcon filename={file.name} className="w-4 h-4 mr-2" />
                    {file.name}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  )
}
