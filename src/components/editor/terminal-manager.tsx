'use client'

import { useState, useEffect, useCallback } from 'react'
import { Terminal } from './terminal'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { TerminalSessionType } from '@/types'

export function TerminalManager() {
  const { data: session } = useSession()
  const [terminals, setTerminals] = useState<TerminalSessionType[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)

  const fetchTerminals = useCallback(async () => {
    if (!session?.user) return;
    try {
      const response = await fetch(`/api/terminal`)
      const data = await response.json()
      if (data.length > 0) {
        setTerminals(data)
        const active = data.find((t: TerminalSessionType) => t.isActive);
        if (active) {
            setActiveTerminalId(active._id);
        } else {
            setActiveTerminalId(data[0]._id);
            await updateTerminal(data[0]._id, { isActive: true });
        }
      } else {
        addTerminal()
      }
    } catch (error) {
      toast.error('Failed to load terminals')
    }
  }, [session]);

  useEffect(() => {
    fetchTerminals()
  }, [fetchTerminals])

  const addTerminal = async () => {
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Terminal ${terminals.length + 1}` })
      })
      const newTerminal = await response.json()
      setTerminals([...terminals, newTerminal])
      setActiveTerminalId(newTerminal._id)
    } catch (error) {
      toast.error('Failed to create terminal')
    }
  }

  const removeTerminal = async (terminalId: string) => {
    if (terminals.length <= 1) {
        toast.info("Cannot close the last terminal.");
        return;
    }
    
    try {
      await fetch(`/api/terminal`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminalId })
      })
      const newTerminals = terminals.filter((t) => t._id !== terminalId)
      setTerminals(newTerminals)
      if (activeTerminalId === terminalId) {
        const newActiveId = newTerminals[0]?._id;
        setActiveTerminalId(newActiveId || null);
        if(newActiveId) await updateTerminal(newActiveId, {isActive: true})
      }
    } catch (error) {
      toast.error('Failed to delete terminal')
    }
  }

  const updateTerminal = async (terminalId: string, updates: Partial<TerminalSessionType>) => {
    if (!terminalId) return
    try {
      await fetch(`/api/terminal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminalId, ...updates })
      })
    } catch (error) {
      console.error('Failed to update terminal:', error)
    }
  }

  const handleSelectTerminal = (terminalId: string) => {
    setActiveTerminalId(terminalId);
    updateTerminal(terminalId, {isActive: true});
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex items-center border-b border-[#3c3c3c]">
        {terminals.map((terminal) => (
          <div
            key={terminal._id}
            className={`px-3 py-1.5 text-sm flex items-center border-r border-[#3c3c3c] cursor-pointer group ${activeTerminalId === terminal._id ? 'bg-[#1e1e1e] text-white' : 'text-[#858585] hover:bg-[#2a2d2e]'}`}
            onClick={() => handleSelectTerminal(terminal._id)}
          >
            {terminal.title}
            <button
              className="ml-2 hover:text-[#cccccc] opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); removeTerminal(terminal._id) }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-1 text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
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
