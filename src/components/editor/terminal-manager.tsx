'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useTerminalManager } from '@/hooks/use-terminal-manager-store'

const Terminal = dynamic(
  () => import('./terminal').then((mod) => mod.Terminal), 
  { ssr: false, loading: () => <p className="p-2 text-sm">Loading Terminal...</p> }
);

export function TerminalManager() {
  const { terminals, activeTerminalId, addTerminal, removeTerminal, setActiveTerminalId, updateTerminal } = useTerminalManager();

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="flex items-center border-b border-border">
        {terminals.map((terminal) => (
          <div
            key={terminal._id}
            className={`px-3 py-1.5 text-sm flex items-center border-r border-border cursor-pointer group ${activeTerminalId === terminal._id ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            onClick={() => setActiveTerminalId(terminal._id)}
          >
            {terminal.title}
            <button
              className="ml-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); removeTerminal(terminal._id) }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={addTerminal}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 relative">
        {terminals.map((terminal) => (
          <div
            key={terminal._id}
            className={`h-full absolute top-0 left-0 w-full transition-opacity ${activeTerminalId === terminal._id ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
             {activeTerminalId === terminal._id && (
                <Terminal terminal={terminal} onUpdate={updateTerminal} />
             )}
          </div>
        ))}
      </div>
    </div>
  )
}
