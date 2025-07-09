'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ReplaceAll } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
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
  const [showReplace, setShowReplace] = useState(false)
  const router = useRouter()
  const { searchFiles, replaceInFiles } = useFileSystem()
  const { activeView } = useActiveView();

  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    const searchResults = await searchFiles(searchQuery);
    setResults(searchResults);
  }, 500);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  }
  
  const handleReplaceAll = async () => {
    if (!query || results.length === 0) return;
    await replaceInFiles(query, replaceQuery);
    setQuery('');
    setResults([]);
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
                  onChange={handleQueryChange}
                  className="h-8 pr-8"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:bg-accent"
                    onClick={() => { setQuery(''); setResults([]); }}
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
                        disabled={!query || results.length === 0}
                        onClick={handleReplaceAll}
                      >
                        <ReplaceAll className="h-4 w-4" />
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
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2">
                  {results.length > 0 ? `${results.length} results in ${new Set(results.map(r => r.file._id)).size} files` : (query ? 'No results found.' : '')}
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
        </div>
      </div>
    </TooltipProvider>
  )
}
