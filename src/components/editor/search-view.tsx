'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, Loader2, ReplaceAll } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { useFileSystem } from '@/hooks/use-file-system'
import { toast } from 'sonner'
import type { FileType, SearchResult } from '@/types'
import { useActiveView } from '@/hooks/use-active-view'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FileIcon } from './file-icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [replaceQuery, setReplaceQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [debouncedQuery] = useDebounce(query, 500)
  const router = useRouter()
  const { refreshFiles } = useFileSystem()
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
  
  const handleReplaceAll = async () => {
    if (!debouncedQuery || results.length === 0 || isReplacing) return;
    setIsReplacing(true);
    try {
      const res = await fetch('/api/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: debouncedQuery, replaceWith: replaceQuery })
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Replace operation failed.');
      }

      const { filesUpdated, replacements } = await res.json();
      if (filesUpdated > 0) {
        toast.success(`Replaced ${replacements} instance(s) in ${filesUpdated} file(s).`);
      } else {
        toast.info("No occurrences found to replace.");
      }
      
      setQuery('');
      setResults([]);
      await refreshFiles();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsReplacing(false);
    }
  };


  const handleResultClick = (file: FileType) => {
    router.push(`/editor/${file._id}`)
  }

  if (activeView !== 'search') {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-card text-card-foreground">
        <div className="p-2 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase">Search</h3>
        </div>
        <div className="p-2 border-b border-border">
          <div className="flex items-start gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setShowReplace(!showReplace)}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  showReplace ? 'rotate-90' : ''
                }`}
              />
            </Button>
            <div className="flex-1 space-y-1">
              <div className="relative">
                <Input
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pr-8"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:bg-accent"
                    onClick={() => setQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {showReplace && (
                <div className="relative">
                  <Input
                    placeholder="Replace"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="h-8 pr-8"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:bg-accent"
                        disabled={
                          !query || isReplacing || results.length === 0
                        }
                        onClick={handleReplaceAll}
                      >
                        {isReplacing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ReplaceAll className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Replace All</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm">Searching...</div>
          ) : (
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2">
                  {results.length > 0 ? `${results.length} results in ${new Set(results.map(r => r.file._id)).size} files` : 'No results found.'}
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
    </TooltipProvider>
  )
}
