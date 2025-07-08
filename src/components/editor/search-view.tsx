'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { useFileSystem } from '@/hooks/use-file-system'
import { toast } from 'sonner'
import type { FileType, SearchResult } from '@/types'
import { useActiveView } from '@/hooks/use-active-view'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FileIcon } from './file-icon'

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  try {
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
  
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
};


export function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [debouncedQuery] = useDebounce(query, 500)
  const router = useRouter()
  const { setActiveFile } = useFileSystem()
  const { activeView } = useActiveView();

  const searchFiles = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
        setResults([])
        return;
    }
    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      toast.error('Search request failed.')
    } finally {
      setIsSearching(false)
    }
  }, []);


  useEffect(() => {
    searchFiles(debouncedQuery)
  }, [debouncedQuery, searchFiles])

  const handleResultClick = (file: FileType) => {
    router.push(`/editor/${file._id}`)
  }

  if (activeView !== 'search') {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Search</h3>
      </div>
      <div className="p-2 border-b border-border flex items-center">
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-background border-input h-8 focus-visible:ring-1 focus-visible:ring-primary"
          autoFocus
        />
        {query && <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:bg-accent"
          onClick={() => setQuery('')}
        >
          <X className="h-4 w-4" />
        </Button>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-4 text-center text-sm">Searching...</div>
        ) : (
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-2">
                {results.length} results in {results.length} files
            </p>
            <Accordion type="multiple" className="w-full">
              {results.map(({ file, matches }) => (
                <AccordionItem value={file._id} key={file._id}>
                  <AccordionTrigger 
                    className="p-1 text-left hover:bg-accent rounded-md text-sm"
                    onClick={() => { if (matches.length === 0) handleResultClick(file) }}
                  >
                    <div className="flex items-center gap-2">
                      <FileIcon filename={file.name} className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="pl-4">
                      {matches.map((match, index) => (
                        <li
                          key={`${file._id}-${index}`}
                          className="text-xs text-muted-foreground truncate p-1 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(file)}
                        >
                          <Highlight text={match.lineContent} highlight={query} />
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  )
}
