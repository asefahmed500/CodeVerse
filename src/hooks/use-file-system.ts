"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Helper to get a flattened list of all files
const flattenFiles = (files: FileType[]): FileType[] => {
    const allFiles: FileType[] = [];
    const recursion = (fs: FileType[]) => {
        fs.forEach(item => {
            allFiles.push(item);
            if(item.isFolder && item.children) recursion(item.children);
        })
    }
    recursion(files);
    return allFiles;
}

interface FileSystemState {
  files: FileType[];
  loading: boolean;
  activeFileId: string | null;
  expandedFolders: string[];
  allFiles: FileType[]; // Derived state
  
  // Actions
  _setFiles: (files: FileType[]) => void;
  fetchFiles: () => Promise<void>;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  updateFile: (fileId: string, updates: Partial<FileType>) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  setActiveFileId: (fileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  replaceInFiles: (query: string, replaceWith: string) => Promise<void>;
  setWorkspaceFromGitHub: (owner: string, repo: string) => Promise<void>;
  reset: () => void;
}

const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
      files: [],
      loading: true,
      activeFileId: null,
      expandedFolders: [],
      allFiles: [],

      _setFiles: (files: FileType[]) => {
        const allFiles = flattenFiles(files);
        set({ files, allFiles });
      },

      fetchFiles: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/files');
          if (!res.ok) throw new Error('Failed to fetch files');
          const files = await res.json();
          get()._setFiles(files);
        } catch (error: any) {
          toast.error(error.message);
          get()._setFiles([]);
        } finally {
          set({ loading: false });
        }
      },

      findFile: (fileId: string) => {
        return get().allFiles.find(f => f._id === fileId) || null;
      },
      
      getPathForFile: (fileId: string): string => {
        const fileMap = new Map(get().allFiles.map(f => [f._id, f]));
        const buildPath = (fId: string): string => {
            const file = fileMap.get(fId);
            if (!file) return '';
            if (!file.parentId) return `/${file.name}`;
            const parentPath = buildPath(file.parentId);
            return parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;
        };
        return buildPath(fileId);
      },

      createFile: async (name: string, parentId?: string) => {
        try {
          const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, isFolder: false, parentId, isOpen: true }),
          });
          const newFile = await res.json();
          if (!res.ok) throw new Error(newFile.error);
          
          await get().fetchFiles(); // Re-fetch to get the latest state
          set({ activeFileId: newFile._id });
          toast.success(`File "${newFile.name}" created.`);
          return newFile;
        } catch (error: any) {
          toast.error(error.message);
          return null;
        }
      },

      createFolder: async (name: string, parentId?: string) => {
        try {
          const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, isFolder: true, parentId }),
          });
          const newFolder = await res.json();
          if (!res.ok) throw new Error(newFolder.error);
          
          await get().fetchFiles();
          set(state => ({ expandedFolders: [...new Set([...state.expandedFolders, parentId || newFolder._id])] }));
          toast.success(`Folder "${newFolder.name}" created.`);
        } catch (error: any) {
          toast.error(error.message);
        }
      },
      
      updateFile: async (fileId: string, updates: Partial<FileType>) => {
        try {
          const res = await fetch('/api/files', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, ...updates }),
          });
          const updatedFile = await res.json();
          if (!res.ok) throw new Error(updatedFile.error);
          await get().fetchFiles();
        } catch (error: any) {
          toast.error(error.message);
          await get().fetchFiles(); // Re-sync on error
        }
      },

      deleteFile: async (fileId: string) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return;
        
        try {
          const res = await fetch('/api/files', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId }),
          });
          const { success, error, newActiveFileId } = await res.json();
          if (!success) throw new Error(error);

          await get().fetchFiles();
          if(get().activeFileId === fileId) {
            set({ activeFileId: newActiveFileId });
          }
          toast.success(`Deleted ${fileToDelete.name}.`);
        } catch (error: any) {
          toast.error(error.message);
        }
      },
      
      setActiveFileId: (fileId: string | null) => {
        set({ activeFileId: fileId });
      },

      toggleFolder: (folderId: string) => {
        set(state => {
            const newSet = new Set(state.expandedFolders);
            if (newSet.has(folderId)) newSet.delete(folderId);
            else newSet.add(folderId);
            return { expandedFolders: Array.from(newSet) };
        });
      },

      searchFiles: async (query: string): Promise<SearchResult[]> => {
          if (!query) return [];
          try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const { results } = await res.json();
            return results;
          } catch (error) {
              toast.error("Search failed.");
              return [];
          }
      },

      replaceInFiles: async (query: string, replaceWith: string) => {
        try {
            const res = await fetch('/api/replace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, replaceWith })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            await get().fetchFiles();
            if (data.filesUpdated > 0) {
              toast.success(`Replaced ${data.replacements} instance(s) in ${data.filesUpdated} file(s).`);
            } else {
              toast.info("No occurrences found to replace.");
            }
        } catch (error: any) {
            toast.error(error.message);
        }
      },
      
      setWorkspaceFromGitHub: async (owner: string, repo: string) => {
        set({ loading: true });
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${owner}&repo=${repo}`);
            const ghFiles = await res.json();
            if (!res.ok) throw new Error(ghFiles.error || "Failed to clone repository.");

            if (ghFiles.length === 0) {
              toast.warning("Repository is empty or contains no supported text files.");
              set({ loading: false });
              return;
            }
            
            // This is a complex operation, ideally done on the backend
            // For now, we'll clear the existing workspace and create new files
            const existingFiles = get().allFiles;
            for (const file of existingFiles) {
                await get().deleteFile(file._id);
            }

            const flatRes = await fetch('/api/files/flat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ghFiles) });
            if (!flatRes.ok) {
              const err = await flatRes.json();
              throw new Error(err.error || 'Failed to process repository files.');
            }

            await get().fetchFiles();
            const firstFile = get().allFiles.find(f => !f.isFolder);
            if(firstFile) {
                set({ activeFileId: firstFile._id });
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            set({ loading: false });
        }
      },
      
      reset: () => {
        // Implement backend reset if needed
        console.log("Resetting file system state");
        set({ files: [], activeFileId: null, expandedFolders: [], allFiles: [] });
      }
    }),
    {
      name: 'codeverse-file-system-v2', 
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for non-persistent state between browser restarts
    }
  )
);


// Custom hook to initialize and use the store
export const useFileSystem = () => {
    const store = useFileSystemStore();
    const { status, data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'authenticated') {
        store.fetchFiles();
      } else if (status === 'unauthenticated') {
        store.reset();
        router.push('/editor');
      }
    }, [status, session, store.fetchFiles, store.reset, router]);

    return store;
}
