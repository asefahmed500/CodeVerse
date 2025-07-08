'use client'

import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { THEMES } from '@/config/themes'
import { useActiveView } from '@/hooks/use-active-view'
import { Label } from '../ui/label'

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { activeView } = useActiveView()

  if (activeView !== 'settings') {
      return null
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
       <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Settings</h3>
      </div>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Appearance</h3>
          <div className='flex items-center justify-between'>
            <Label htmlFor="theme-select" className='text-sm'>Color Theme</Label>
            <Select
                value={theme}
                onValueChange={setTheme}
            >
                <SelectTrigger id="theme-select" className="w-[220px] bg-background border-input text-foreground">
                <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                {THEMES.map((t) => (
                    <SelectItem 
                    key={t.value} 
                    value={t.value}
                    className="focus:bg-accent"
                    >
                    {t.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
