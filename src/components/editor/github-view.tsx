'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Github, GitPullRequest, File as FileIcon, Folder, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { useSession, signIn } from 'next-auth/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GitHubRepo, GitHubContentItem, GitHubBranch } from '@/types'
import { useActiveView } from '@/hooks/use-active-view'

export function GitHubView() {
  const { data: session } = useSession()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [repoContent, setRepoContent] = useState<GitHubContentItem[]>([])
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [isLoading, setIsLoading] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [prMessage, setPrMessage] = useState('')
  const { activeView } = useActiveView();

  useEffect(() => {
    if (session?.user && activeView === 'github' && repos.length === 0) {
      fetchRepos()
    }
  }, [session, activeView, repos.length])

  const fetchRepos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github?action=getRepos')
      if (!response.ok) throw new Error('Failed to fetch repositories')
      const data = await response.json()
      setRepos(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch repositories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setIsLoading(true)
    try {
      const contentRes = await fetch(`/api/github?action=getRepoContent&owner=${repo.owner.login}&repo=${repo.name}&path=`)
      if(!contentRes.ok) throw new Error('Failed to fetch repo content')
      const contentData = await contentRes.json()
      setRepoContent(Array.isArray(contentData) ? contentData.sort((a,b) => (a.type === 'dir' ? -1 : 1)) : [])
      
      const branchesRes = await fetch(`/api/github?action=getBranches&owner=${repo.owner.login}&repo=${repo.name}`)
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData)
        const defaultBranch = branchesData.find((b: any) => b.name === repo.default_branch) || branchesData[0];
        if (defaultBranch) setSelectedBranch(defaultBranch.name);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load repository details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommitAndPR = async () => {
    if (!selectedRepo || !prMessage || isCommitting) return;
    setIsCommitting(true);
    
    try {
      const filesRes = await fetch('/api/files/flat');
      if (!filesRes.ok) throw new Error('Could not fetch project files.');
      const filesToCommit = await filesRes.json();

      if (filesToCommit.length === 0) {
        toast.info("There are no files to commit.");
        return;
      }

      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'commitAndPush',
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
            branch: selectedBranch,
            message: prMessage,
            files: filesToCommit
        })
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to create Pull Request.');
      }

      const { prUrl } = await res.json();
      toast.success(
        <div className="flex flex-col items-start">
            <span>Pull Request created!</span>
            <a href={prUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-primary">
                View on GitHub
            </a>
        </div>
      );
      setPrMessage('');

    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setIsCommitting(false);
    }
  };


  if (activeView !== 'github') {
    return null;
  }

  if (!session) {
    return (
      <div className="h-full flex flex-col bg-card text-card-foreground p-4 text-center items-center justify-center">
        <p className="text-sm mb-4">Please sign in to view GitHub repositories.</p>
        <Button onClick={() => signIn('github')}>
          <Github className="h-4 w-4 mr-2" />
          Sign in with GitHub
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between group">
        <h3 className="font-bold text-sm uppercase">Source Control</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 hidden group-hover:flex" onClick={fetchRepos}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''}/>
        </Button>
      </div>

      {!selectedRepo ? (
        <div>
          <h4 className="font-medium p-2 text-sm text-muted-foreground">Repositories</h4>
          {isLoading ? (
            <div className="p-4 text-center text-xs">Loading repositories...</div>
          ) : (
            <ul className="overflow-y-auto">
              {repos.map((repo) => (
                <li 
                  key={repo.id}
                  className="p-2 hover:bg-accent rounded cursor-pointer text-sm"
                  onClick={() => handleRepoSelect(repo)}
                >
                  {repo.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <button 
              className="text-sm text-foreground hover:underline"
              onClick={() => setSelectedRepo(null)}
            >
              &larr; Repos
            </button>
            <span className="text-sm font-medium truncate">{selectedRepo.name}</span>
          </div>

          <div className="p-2 border-b border-border">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-8 bg-background border-input text-foreground">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {branches.map((branch) => (
                  <SelectItem key={branch.name} value={branch.name} className="hover:bg-accent">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto p-2 text-sm">
            {isLoading ? (
              <div className="p-4 text-center text-xs">Loading content...</div>
            ) : (
              repoContent.map(item => (
                  <div key={item.path} className="flex items-center p-1 rounded hover:bg-accent">
                    {item.type === 'dir' ? <Folder className="h-4 w-4 mr-2 text-blue-400" /> : <FileIcon className="h-4 w-4 mr-2 text-gray-400" />}
                    <span className="truncate">{item.name}</span>
                  </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border">
            <Input
              placeholder="Commit message..."
              value={prMessage}
              onChange={(e) => setPrMessage(e.target.value)}
              className="bg-background border-input text-foreground mb-2"
            />
            <Button
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isCommitting || !prMessage.trim()}
                onClick={handleCommitAndPR}
            >
                {isCommitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <GitPullRequest className="h-4 w-4 mr-2" />
                )}
                {isCommitting ? 'Committing...' : 'Commit & Create Pull Request'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
