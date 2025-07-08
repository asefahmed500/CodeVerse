'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { THEMES } from '@/config/themes'
import { useActiveView } from '@/hooks/use-active-view'
import { useEditorSettingsStore } from '@/hooks/use-editor-settings-store'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { useFileSystem } from '@/hooks/use-file-system'
import { useTerminalManager } from '@/hooks/use-terminal-manager-store'
import { UserButton } from '@/components/auth/user-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { activeView } = useActiveView()
  const { reset: resetFileSystem } = useFileSystem()
  const { reset: resetTerminals } = useTerminalManager()
  const [isResetAlertOpen, setResetAlertOpen] = useState(false);

  const {
    fontSize, setFontSize,
    tabSize, setTabSize,
    wordWrap, setWordWrap,
    minimap, setMinimap,
    vimMode, setVimMode,
    resetSettings
  } = useEditorSettingsStore();

  if (activeView !== 'settings') {
      return null
  }

  const handleResetWorkspace = () => {
    resetFileSystem();
    resetTerminals();
    setResetAlertOpen(false);
    toast.success("Workspace has been reset.");
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
       <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Settings</h3>
        <Button variant="ghost" size="sm" onClick={resetSettings}>Reset Editor Settings</Button>
      </div>
      <div className="p-4 space-y-8 flex-1 overflow-y-auto">
        
        <div className='space-y-4'>
          <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
           <div className='flex items-center justify-between'>
              <Label className='text-sm'>GitHub Account</Label>
              <UserButton />
            </div>
        </div>

        <div className='space-y-4'>
          <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
          <div className='flex items-center justify-between'>
            <Label htmlFor="theme-select" className='text-sm'>Color Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select" className="w-[220px] bg-background border-input text-foreground">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                {THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="focus:bg-accent">{t.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-4'>
            <h3 className="text-sm font-medium text-muted-foreground">Editor</h3>
            <div className='flex items-center justify-between'>
              <Label htmlFor="font-size-select" className='text-sm'>Font Size</Label>
              <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                  <SelectTrigger id="font-size-select" className="w-[220px] bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {[10, 12, 14, 16, 18, 20, 24].map(size => (
                        <SelectItem key={size} value={String(size)} className="focus:bg-accent">{size}px</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between'>
              <Label htmlFor="tab-size-select" className='text-sm'>Tab Size</Label>
              <Select value={String(tabSize)} onValueChange={(v) => setTabSize(Number(v))}>
                  <SelectTrigger id="tab-size-select" className="w-[220px] bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {[2, 4, 8].map(size => (
                        <SelectItem key={size} value={String(size)} className="focus:bg-accent">{size} spaces</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between'>
                <Label htmlFor="word-wrap-switch" className='text-sm'>Word Wrap</Label>
                <Switch 
                    id="word-wrap-switch"
                    checked={wordWrap === 'on'}
                    onCheckedChange={(checked) => setWordWrap(checked ? 'on' : 'off')}
                />
            </div>
            <div className='flex items-center justify-between'>
                <Label htmlFor="minimap-switch" className='text-sm'>Minimap</Label>
                <Switch 
                    id="minimap-switch"
                    checked={minimap}
                    onCheckedChange={setMinimap}
                />
            </div>
             <div className='flex items-center justify-between'>
                <Label htmlFor="vim-mode-switch" className='text-sm'>Vim Keybindings</Label>
                <Switch 
                    id="vim-mode-switch"
                    checked={vimMode}
                    onCheckedChange={setVimMode}
                />
            </div>
        </div>

        <div className='space-y-4'>
            <h3 className="text-sm font-medium text-muted-foreground">Workspace</h3>
             <div className='flex items-center justify-between'>
                <div className='flex flex-col space-y-1'>
                    <Label htmlFor="reset-workspace" className='text-sm'>Reset Workspace</Label>
                    <p className='text-xs text-muted-foreground'>This will delete all your files and terminals. This action cannot be undone.</p>
                </div>
                <AlertDialog open={isResetAlertOpen} onOpenChange={setResetAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button id="reset-workspace" variant="destructive">Reset</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your entire workspace, including all files, folders, and terminal history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetWorkspace}>
                        Yes, reset workspace
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>
    </div>
  )
}
