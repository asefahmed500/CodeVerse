'use client'

import { Github } from 'lucide-react'
import { useActiveView } from '@/hooks/use-active-view'

export function GitHubView() {
  const { activeView } = useActiveView();

  if (activeView !== 'github') {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Source Control</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Github className="h-10 w-10 text-muted-foreground mb-4" />
        <h4 className="font-medium">Source control not available</h4>
        <p className="text-sm text-muted-foreground">
          This feature requires a backend connection and user authentication, which is not enabled in this local-only version of CodeVerse.
        </p>
      </div>
    </div>
  )
}
