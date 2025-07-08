'use client'

import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { THEMES } from '@/config/themes'
import { useActiveView } from '@/hooks/use-active-view'
import { useEditorSettingsStore } from '@/hooks/use-editor-settings-store'
import { Label } from '../ui/label'
import { toast } from 'sonner'

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { activeView } = useActiveView()
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

  const handleVimModeChange = (enabled: boolean) => {
    if (enabled) {
      toast.info("Vim mode is not yet implemented.");
    }
    setVimMode(enabled);
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
       <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Settings</h3>
        <Button variant="ghost" size="sm" onClick={resetSettings}>Reset All</Button>
      </div>
      <div className="p-4 space-y-8 flex-1 overflow-y-auto">
        
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
        </div>

        <div className='space-y-4'>
            <h3 className="text-sm font-medium text-muted-foreground">Keybindings</h3>
            <div className='flex items-center justify-between'>
                <Label htmlFor="vim-mode-switch" className='text-sm'>Vim Mode</Label>
                <Switch 
                    id="vim-mode-switch"
                    checked={vimMode}
                    onCheckedChange={handleVimModeChange}
                />
            </div>
        </div>
      </div>
    </div>
  )
}
