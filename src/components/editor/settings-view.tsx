'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useEditorStore } from '@/hooks/use-editor-store'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { activeView } = useActiveView()
  const { reset: resetFileSystem, allFiles, getPathForFile } = useFileSystem()
  const { reset: resetTerminals } = useTerminalManager()
  const { reset: resetEditor } = useEditorStore();
  const router = useRouter();

  const [isResetAlertOpen, setResetAlertOpen] = useState(false);

  const {
    fontSize, setFontSize,
    tabSize, setTabSize,
    resetSettings
  } = useEditorSettingsStore();

  if (activeView !== 'settings') {
      return null
  }

  const handleResetWorkspace = async () => {
    setResetAlertOpen(false);
    const toastId = toast.loading('Resetting workspace...');

    try {
        await resetFileSystem();
        await Promise.resolve(resetTerminals());
        await Promise.resolve(resetEditor());

        router.replace('/editor');
        toast.success('Workspace has been reset.', { id: toastId });
    } catch (error) {
        console.error("Failed to reset workspace:", error);
        toast.error('Failed to reset workspace.', { id: toastId });
    }
  }
  
  const handleExportWorkspace = async () => {
    const zip = new JSZip();
    const toastId = toast.loading("Zipping workspace...");

    try {
        allFiles.forEach(file => {
            if (!file.isFolder) {
                const path = getPathForFile(file._id);
                // Remove the leading slash for correct zip structure
                zip.file(path.substring(1), file.content);
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'CodeVerse-Workspace.zip');
        toast.success("Workspace exported successfully.", { id: toastId });
    } catch (error) {
        console.error("Failed to export workspace:", error);
        toast.error("Failed to export workspace.", { id: toastId });
    }
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
            <div className='flex items-center justify-between'>
                <div className='flex flex-col space-y-1'>
                    <Label htmlFor="export-workspace" className='text-sm'>Export Workspace</Label>
                    <p className='text-xs text-muted-foreground'>Download all your files and folders as a ZIP archive.</p>
                </div>
                <Button id="export-workspace" variant="outline" onClick={handleExportWorkspace}>Export to .zip</Button>
            </div>
        </div>
      </div>
    </div>
  )
}
