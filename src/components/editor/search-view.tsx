'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, File as FileIcon } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { useFileSystem } from '@/hooks/use-file-system'
import { toast } from 'sonner'
import type { FileType } from '@/types'
import { useActiveView } from '@/hooks/use-active-view'

export function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FileType[]>([])
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

  const handleResultClick = (result: FileType) => {
    router.push(`/editor/${result._id}`)
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
            <ul>
                {results.map((result) => (
                <li 
                    key={result._id} 
                    className="p-2 hover:bg-accent cursor-pointer rounded-md"
                    onClick={() => handleResultClick(result)}
                >
                    <div className="flex items-center font-medium text-sm">
                        <FileIcon className="h-4 w-4 mr-2" />
                        {result.name}
                    </div>
                    {result.content && !result.isFolder && (
                    <div className="text-xs text-muted-foreground truncate mt-1 pl-6">
                        {result.content.substring(0, 100).replace(/\n/g, ' ')}
                    </div>
                    )}
                </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
