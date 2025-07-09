'use client'

import { useState } from 'react'
import { Github, Check } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { useActiveView } from '@/hooks/use-active-view'
import { useFileSystem } from '@/hooks/use-file-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { FileIcon } from './file-icon'
import { useRouter } from 'next/navigation'
import type { FileType } from '@/types'

function CloneView() {
    const [repoUrl, setRepoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setWorkspaceFromGitHub } = useFileSystem();
    const router = useRouter();

    const handleClone = async () => {
        let owner, repo;
        try {
            const url = new URL(repoUrl);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (url.hostname !== 'github.com' || pathParts.length < 2) {
                throw new Error();
            }
            [owner, repo] = pathParts;
        } catch (error) {
            toast.error("Invalid GitHub repository URL.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await setWorkspaceFromGitHub(owner, repo);
            if (result?.firstFileId) {
                router.replace(`/editor/${result.firstFileId}`);
            } else {
                router.replace('/editor');
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to clone repository.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Github className="h-10 w-10 text-muted-foreground mb-4" />
            <h4 className="font-medium">Clone a repository</h4>
            <p className="text-sm text-muted-foreground mb-4">
                Your workspace is empty. Clone a public repository to get started.
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleClone()}
                />
                <Button onClick={handleClone} disabled={isLoading || !repoUrl}>
                    {isLoading ? 'Cloning...' : 'Clone'}
                </Button>
            </div>
        </div>
    )
}

function CommitView() {
    const { allFiles, dirtyFileIds, commitChanges } = useFileSystem();
    const router = useRouter();
    const [commitMessage, setCommitMessage] = useState('');

    const changedFiles = allFiles.filter(f => dirtyFileIds.includes(f._id) && !f.isFolder);

    const handleFileClick = (file: FileType) => {
        if (!file.isFolder) {
            router.push(`/editor/${file._id}`);
        }
    }
    
    const handleCommit = () => {
        if (!commitMessage.trim()) {
            toast.error("Please enter a commit message.");
            return;
        }
        toast.success("Changes committed (simulation).");
        setCommitMessage('');
        commitChanges();
    }

    return (
        <div className="flex-1 flex flex-col p-2 space-y-4">
            <div>
                <Input 
                    placeholder="Commit message" 
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    disabled={changedFiles.length === 0}
                />
                <Button 
                    className="w-full mt-2" 
                    onClick={handleCommit} 
                    disabled={!commitMessage.trim() || changedFiles.length === 0}
                >
                    Commit ({changedFiles.length}) Changes
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 border-t border-border">
                {changedFiles.length > 0 ? (
                    <ul>
                        {changedFiles.map(file => (
                            <li
                                key={file._id}
                                className="flex items-center gap-2 p-1 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => handleFileClick(file)}
                            >
                                <FileIcon filename={file.name} isFolder={file.isFolder} className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm truncate">{file.name}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Check className="h-8 w-8 mb-2 text-green-500" />
                        <p className="text-sm font-medium">No changes</p>
                        <p className="text-xs">Your workspace is clean.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export function GitHubView() {
  const { activeView } = useActiveView();
  const { data: session, status } = useSession();
  const { files, loading } = useFileSystem();

  if (activeView !== 'github') {
    return null;
  }
  
  const isWorkspaceEmpty = !loading && files.length === 0;
  const hasGithubAuth = !!(session?.user as any)?.accessToken;

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Source Control</h3>
      </div>
      
      {status === 'loading' && <p className="p-4 text-sm text-muted-foreground">Loading authentication...</p>}
      
      {status === 'authenticated' && (
        hasGithubAuth ? (
          // User is fully authenticated with GitHub
          isWorkspaceEmpty ? <CloneView /> : <CommitView />
        ) : (
          // User is authenticated with credentials, needs to link GitHub
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Github className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect your GitHub account to clone repositories and manage source control.
            </p>
            <Button onClick={() => signIn('github')}>Connect with GitHub</Button>
          </div>
        )
      )}
      
      {status === 'unauthenticated' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Github className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
                Sign in to use source control features.
            </p>
            <Button onClick={() => signIn('github')}>Sign in with GitHub</Button>
        </div>
      )}
    </div>
  )
}
