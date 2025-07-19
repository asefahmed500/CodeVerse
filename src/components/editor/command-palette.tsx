'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { useMemo } from 'react'
import { File, Search, Settings, GitBranch, TerminalSquare, Github, FolderPlus, FilePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFileSystem } from '@/hooks/use-file-system'
import { useActiveView } from '@/hooks/use-active-view'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FileIcon } from './file-icon'
import type { FileType } from '@/types'
import { useCommandPaletteStore } from '@/hooks/use-command-palette-store'

export function CommandPalette() {
  const { isOpen: open, setOpen } = useCommandPaletteStore();
  const router = useRouter()
  const { allFiles, createFile, createFolder } = useFileSystem()
  const { setActiveView, openView } = useActiveView()
  const { setTheme } = useTheme()

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const fileList = useMemo(() => allFiles.filter(f => !f.isFolder), [allFiles]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border p-0 overflow-hidden shadow-2xl top-40">
          <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandPrimitive.Input 
              placeholder="Type a command or search..."
              className="w-full px-4 h-12 bg-transparent border-b border-border text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <CommandPrimitive.List className="max-h-[400px] overflow-y-auto">
              <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </CommandPrimitive.Empty>

              <CommandPrimitive.Group heading="General" className="text-muted-foreground pt-2">
                <CommandPrimitive.Item 
                  onSelect={() => runCommand(async () => {
                    const newFile = await createFile('Untitled.js');
                    if (newFile) {
                        router.push(`/editor/${newFile._id}`);
                    }
                  })}
                  className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground"
                >
                  <FilePlus className="w-4 h-4 mr-2" />
                  New File
                </CommandPrimitive.Item>
                <CommandPrimitive.Item 
                  onSelect={() => runCommand(() => {
                    createFolder('New Folder');
                  })}
                  className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </CommandPrimitive.Item>
                 <CommandPrimitive.Item 
                  onSelect={() => runCommand(() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark'))}
                  className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <Settings className="w-4 h-4 mr-2" />
                  Toggle Color Theme
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => openView('settings'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <Settings className="w-4 h-4 mr-2" /> Open Settings
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>

              <CommandPrimitive.Group heading="View" className="text-muted-foreground pt-2">
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('explorer'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <File className="w-4 h-4 mr-2" /> Show Explorer
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('search'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <Search className="w-4 h-4 mr-2" /> Show Search
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => setActiveView('github'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <Github className="w-4 h-4 mr-2" /> Show Source Control
                </CommandPrimitive.Item>
                <CommandPrimitive.Item onSelect={() => runCommand(() => openView('terminal'))} className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground">
                  <TerminalSquare className="w-4 h-4 mr-2" /> Show Terminal
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>
              
              <CommandPrimitive.Group heading="Go to File" className="text-muted-foreground pt-2">
                {fileList.slice(0, 10).map((file) => (
                  <CommandPrimitive.Item 
                    key={file._id}
                    onSelect={() => runCommand(() => router.push(`/editor/${file._id}`))}
                    className="flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground"
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
