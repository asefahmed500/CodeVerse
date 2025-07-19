
'use client'

import { useState } from 'react'
import { Github, Check, GitCommitHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { useActiveView } from '@/hooks/use-active-view'
import { useFileSystem } from '@/hooks/use-file-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { FileIcon } from './file-icon'
import { useRouter } from 'next/navigation'
import type { FileType } from '@/types'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Textarea } from '../ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function CloneView() {
    const [repoUrl, setRepoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setWorkspaceFromGitHub } = useFileSystem();
    const router = useRouter();

    const handleClone = async () => {
        let owner, repo;
        try {
            const cleanUrl = repoUrl.replace(/\.git$/, '');
            const url = new URL(cleanUrl);
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
        const toastId = toast.loading(`Cloning ${owner}/${repo}...`);
        try {
            const result = await setWorkspaceFromGitHub(owner, repo);
            if (result?.firstFileId) {
                router.replace(`/editor/${result.firstFileId}`);
            } else {
                router.replace('/editor');
            }
            toast.success("Repository cloned successfully.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to clone repository.", { id: toastId });
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
    const { allFiles, dirtyFileIds, getPathForFile, commitChanges, pullChanges } = useFileSystem();
    const router = useRouter();
    const [commitMessage, setCommitMessage] = useState('');
    const [stagedFiles, setStagedFiles] = useState<string[]>([]);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    const changedFiles = allFiles.filter(f => dirtyFileIds.includes(f._id) && !f.isFolder);

    const handleFileClick = (file: FileType) => {
        if (!file.isFolder) {
            router.push(`/editor/${file._id}`);
        }
    }
    
    const toggleStaged = (fileId: string) => {
        setStagedFiles(prev => 
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    }

    const handlePull = async () => {
        setIsPulling(true);
        try {
            await pullChanges();
        } catch (e: any) {
            // Error toasts are handled within the pullChanges function
        } finally {
            setIsPulling(false);
        }
    }
    
    const handleCommitAndPush = async () => {
        if (!commitMessage.trim()) {
            toast.error("Please enter a commit message.");
            return;
        }
        if (stagedFiles.length === 0) {
            toast.error("Please stage at least one file to commit.");
            return;
        }

        setIsPushing(true);
        const toastId = toast.loading("Pushing changes to GitHub...");

        try {
            const { owner, repo } = useFileSystem.getState().gitInfo || {};
            if (!owner || !repo) {
                throw new Error("Could not determine repository owner and name. Please re-clone.");
            }

            const filesToPush = stagedFiles.map(id => {
                const file = allFiles.find(f => f._id === id)!;
                return {
                    path: getPathForFile(id).substring(1), // remove leading slash
                    content: file.content
                };
            });

            const res = await fetch('/api/github/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner,
                    repo,
                    files: filesToPush,
                    commitMessage
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to push changes.");
            }

            toast.success("Changes pushed successfully!", { id: toastId });
            commitChanges(stagedFiles); // Mark only pushed files as clean
            setStagedFiles([]);
            setCommitMessage('');

        } catch (e: any) {
            toast.error(`Push failed: ${e.message}`, { id: toastId });
        } finally {
            setIsPushing(false);
        }
    }

    return (
        <div className="flex-1 flex flex-col p-2 space-y-4">
             <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={isPulling || isPushing}>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        {isPulling ? 'Pulling...' : 'Pull Changes'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Pull Remote Changes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will fetch the latest version from GitHub and update your workspace. Any local files you haven't modified will be overwritten. Conflicting changes will be skipped to protect your work. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePull}>Pull</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="p-2 border rounded-md">
                <Textarea 
                    placeholder="Commit message" 
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="text-sm h-16"
                    disabled={isPushing || isPulling}
                />
                <Button 
                    className="w-full mt-2" 
                    onClick={handleCommitAndPush} 
                    disabled={isPushing || isPulling || !commitMessage.trim() || stagedFiles.length === 0}
                >
                    {isPushing ? (
                        <>
                        <ArrowUp className="mr-2 h-4 w-4 animate-pulse" /> Pushing...
                        </>
                    ) : (
                        <>
                         <GitCommitHorizontal className="mr-2 h-4 w-4" /> Commit & Push ({stagedFiles.length})
                        </>
                    )}
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto border-t border-border pt-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground px-2 pb-2">
                    Changes ({changedFiles.length})
                </h4>
                {changedFiles.length > 0 ? (
                    <ScrollArea className="h-[calc(100%-30px)]">
                        <ul>
                            {changedFiles.map(file => (
                                <li
                                    key={file._id}
                                    className="flex items-center gap-2 p-1 rounded-md hover:bg-accent"
                                >
                                    <Checkbox 
                                        id={`stage-${file._id}`} 
                                        checked={stagedFiles.includes(file._id)}
                                        onCheckedChange={() => toggleStaged(file._id)}
                                    />
                                    <label
                                      htmlFor={`stage-${file._id}`}
                                      className="flex items-center gap-2 cursor-pointer w-full"
                                      onClick={(e) => { e.preventDefault(); toggleStaged(file._id); }}
                                    >
                                        <FileIcon filename={file.name} isFolder={file.isFolder} className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm truncate">{file.name}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
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
  const { allFiles, loading, gitInfo } = useFileSystem();

  if (activeView !== 'github') {
    return null;
  }
  
  const isWorkspaceEmpty = !loading && allFiles.length === 0;
  const hasGithubAuth = !!(session?.user as any)?.accessToken;

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Source Control</h3>
        {gitInfo && <span className="text-xs text-muted-foreground">{gitInfo.owner}/{gitInfo.repo}</span>}
      </div>
      
      {status === 'loading' && <p className="p-4 text-sm text-muted-foreground">Loading authentication...</p>}
      
      {status === 'authenticated' && (
        hasGithubAuth ? (
          isWorkspaceEmpty ? <CloneView /> : <CommitView />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Github className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect your GitHub account to use source control.
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
