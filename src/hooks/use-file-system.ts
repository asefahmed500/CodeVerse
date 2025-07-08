"use client";

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { useCallback } from 'react';

const buildFileTree = (files: FileType[]): FileType[] => {
    const fileMap = new Map<string, FileType>();
    const roots: FileType[] = [];
    files.forEach(file => {
        fileMap.set(file._id, { ...file, children: [] });
    });
    files.forEach(file => {
        if (file.parentId && fileMap.has(file.parentId)) {
            const parent = fileMap.get(file.parentId);
            if (parent) {
                parent.children?.push(fileMap.get(file._id)!);
            }
        } else {
            roots.push(fileMap.get(file._id)!);
        }
    });
    return roots;
};

const getFlatFiles = (files: FileType[]): FileType[] => {
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
  files: FileType[]; // The tree structure
  allFiles: FileType[]; // A flat list for easy lookups
  activeFileId: string | null;
  expandedFolders: string[];
  loading: boolean;
  
  fetchFiles: () => Promise<void>;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string | null, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string | null) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>, options?: { optimistic?: boolean, noUpdate?: boolean }) => Promise<void>;
  deleteFile: (fileId: string) => Promise<{ nextActiveFileId: string | null }>;
  duplicateFileOrFolder: (fileId: string) => Promise<void>;
  setActiveFileId: (fileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  replaceInFiles: (query: string, replaceWith: string) => Promise<void>;
  setWorkspaceFromGitHub: (owner: string, repo: string) => Promise<{ firstFileId: string | null } | void>;
  reset: () => void; // This will now be a server-side action
}

const useFileSystemStore = create<FileSystemState>((set, get) => ({
    files: [],
    allFiles: [],
    activeFileId: null,
    expandedFolders: [],
    loading: true,

    fetchFiles: async () => {
        set({ loading: true });
        try {
            const res = await fetch('/api/files');
            if (!res.ok) throw new Error('Failed to fetch files');
            const tree: FileType[] = await res.json();
            set({
                files: tree,
                allFiles: getFlatFiles(tree),
                loading: false,
            });
        } catch (error: any) {
            toast.error(error.message);
            set({ loading: false });
        }
    },

    findFile: (fileId: string) => {
        if (!fileId) return null;
        return get().allFiles.find(f => f._id === fileId) || null;
    },
      
    getPathForFile: (fileId: string): string => {
        const fileMap = new Map(get().allFiles.map(f => [f._id, f]));
        const startFile = fileMap.get(fileId);
        if (!startFile) return '';
        
        const pathParts: string[] = [startFile.name];
        let currentParentId = startFile.parentId;
        
        while (currentParentId) {
            const parent = fileMap.get(currentParentId);
            if (parent) {
                pathParts.unshift(parent.name);
                currentParentId = parent.parentId;
            } else {
                break;
            }
        }
        return `/${pathParts.join('/')}`;
    },

    createFile: async (name, parentId = null, content = '') => {
        const newFilePayload = {
          name, content, isFolder: false, parentId,
          language: getLanguageConfigFromFilename(name).monacoLanguage,
        };

        const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFilePayload),
        });

        if (!res.ok) {
            toast.error("Failed to create file.");
            return null;
        }

        const createdFile: FileType = await res.json();
        
        set(produce((state: FileSystemState) => {
            const newFileWithState = {
                ...createdFile,
                isOpen: true,
                isActive: true
            };
            
            // Deactivate previously active file
            const currentActive = state.allFiles.find(f => f._id === state.activeFileId);
            if (currentActive) {
                currentActive.isActive = false;
            }
            
            state.allFiles.push(newFileWithState);
            state.files = buildFileTree(state.allFiles);
            state.activeFileId = newFileWithState._id;

            if (parentId && !state.expandedFolders.includes(parentId)) {
                state.expandedFolders.push(parentId);
            }
        }));

        toast.success(`File "${createdFile.name}" created.`);
        return get().findFile(createdFile._id); // Return the file with its client-side state
    },

    createFolder: async (name: string, parentId: string | null = null) => {
        const newFolderPayload = {
            name, content: '', isFolder: true, parentId, children: [],
            language: 'plaintext',
        };

        const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFolderPayload),
        });

        if (!res.ok) {
            toast.error("Failed to create folder.");
            return null;
        }

        const newFolder: FileType = await res.json();
        
        set(produce((state: FileSystemState) => {
            const newFolderWithState = { ...newFolder, isOpen: false, isActive: false };
            state.allFiles.push(newFolderWithState);
            state.files = buildFileTree(state.allFiles);
            if (parentId && !state.expandedFolders.includes(parentId)) {
                state.expandedFolders.push(parentId);
            }
        }));

        toast.success(`Folder "${newFolder.name}" created.`);
        return get().findFile(newFolder._id);
    },

    updateFile: async (fileId, updates, options = { optimistic: false }) => {
        if (options.optimistic && !options.noUpdate) {
            set(produce((state: FileSystemState) => {
                const file = state.allFiles.find(f => f._id === fileId);
                if (file) Object.assign(file, updates);
                state.files = buildFileTree(state.allFiles);
            }));
        }
        
        if (updates.name && updates.name !== get().findFile(fileId)?.name) {
             updates.language = getLanguageConfigFromFilename(updates.name).monacoLanguage;
        }

        const res = await fetch(`/api/files?fileId=${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        
        if (!res.ok) {
            toast.error("Failed to save file.");
            // Consider rolling back optimistic update here
            get().fetchFiles(); // Re-fetch to be safe
            return;
        }

        const updatedFile = await res.json();
        set(produce((state: FileSystemState) => {
            const file = state.allFiles.find(f => f._id === fileId);
            if(file) Object.assign(file, updatedFile);
            state.files = buildFileTree(state.allFiles);
        }));

        if(!options.optimistic) toast.success(`Saved ${updatedFile.name}.`);
    },

    deleteFile: async (fileId) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return { nextActiveFileId: null };

        let nextActiveFileId: string | null = get().activeFileId;
        const wasActive = get().activeFileId === fileId;

        if (wasActive) {
            const openFiles = get().allFiles.filter(f => !f.isFolder && f.isOpen && f._id !== fileId);
            openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            nextActiveFileId = openFiles[0]?._id ?? null;
        }

        const res = await fetch(`/api/files?fileId=${fileId}`, { method: 'DELETE' });
        if (!res.ok) {
            toast.error("Failed to delete item.");
            return { nextActiveFileId: get().activeFileId };
        }
        
        // Optimistically update the state before refetching
        set(produce((state: FileSystemState) => {
            const idsToDelete = new Set<string>([fileId]);
            if (fileToDelete.isFolder) {
                const findDescendants = (parentId: string) => {
                    state.allFiles.forEach(f => {
                        if (f.parentId === parentId) {
                            idsToDelete.add(f._id);
                            if (f.isFolder) findDescendants(f._id);
                        }
                    });
                };
                findDescendants(fileId);
            }
            state.allFiles = state.allFiles.filter(f => !idsToDelete.has(f._id));
            state.files = buildFileTree(state.allFiles);
        }));

        toast.success(`Deleted ${fileToDelete.name}.`);
        return { nextActiveFileId };
    },

    duplicateFileOrFolder: async (fileId: string) => {
        const originalNode = get().findFile(fileId);
        if (!originalNode) return;
        
        const res = await fetch('/api/files?action=duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId: fileId })
        });

        if (!res.ok) {
            toast.error("Failed to duplicate item.");
            return;
        }

        const duplicatedFile = await res.json();
        
        // Find a new name for the duplicated item
        const siblingNames = get().allFiles
            .filter(f => f.parentId === originalNode.parentId)
            .map(f => f.name);
            
        let newName = originalNode.name;
        const extIndex = newName.lastIndexOf('.');
        const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
        const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
        
        let counter = 1;
        do {
            newName = `${baseName} copy${counter > 1 ? ` ${counter}` : ''}${extension}`;
            counter++;
        } while (siblingNames.includes(newName));

        // Update the name of the newly created duplicate
        await get().updateFile(duplicatedFile._id, { name: newName });
        await get().fetchFiles(); // Refetch to get the full duplicated structure

        toast.success(`Duplicated "${originalNode.name}"`);
    },

    setActiveFileId: (fileId) => {
        set(produce((state: FileSystemState) => {
            if (state.activeFileId === fileId) return;

            const oldActive = state.allFiles.find(f => f._id === state.activeFileId);
            if (oldActive) oldActive.isActive = false;

            const newActive = fileId ? state.allFiles.find(f => f._id === fileId) : null;
            if (newActive) {
                newActive.isActive = true;
                if (!newActive.isFolder) newActive.isOpen = true;
            }
            state.activeFileId = fileId;
            // No need to rebuild tree if only active state changes
            // state.files = buildFileTree(state.allFiles);
        }));
    },

    toggleFolder: (folderId) => {
        set(produce((state: FileSystemState) => {
            const index = state.expandedFolders.indexOf(folderId);
            if (index > -1) state.expandedFolders.splice(index, 1);
            else state.expandedFolders.push(folderId);
        }));
    },

    searchFiles: async (query) => {
        if (!query) return [];
        const allFiles = get().allFiles;
        const results: SearchResult[] = [];
        try {
            const regex = new RegExp(query, 'gi');
            for (const file of allFiles) {
                if (file.isFolder || !file.content) continue;
                const matches = [...file.content.matchAll(regex)];
                if (matches.length > 0) {
                    const lineMatches = new Map<number, SearchMatch>();
                    const lines = file.content.split('\n');
                    for (const match of matches) {
                        if (match.index === undefined) continue;
                        let lineNum = (file.content.substring(0, match.index).match(/\n/g) || []).length;
                        if (!lineMatches.has(lineNum)) {
                            lineMatches.set(lineNum, { lineNumber: lineNum + 1, lineContent: lines[lineNum] });
                        }
                    }
                    results.push({ file, matches: Array.from(lineMatches.values()) });
                }
            }
        } catch (e) {
            toast.error("Invalid regular expression in search query.");
            return [];
        }
        return results;
    },

    replaceInFiles: async (query, replaceWith) => {
        const searchResults = await get().searchFiles(query);
        if (searchResults.length === 0) {
            toast.info("No occurrences found.");
            return;
        }
        
        try {
            const regex = new RegExp(query, 'g');
            let totalReplacements = 0;
            
            const updatePromises = searchResults.map(result => {
                const newContent = result.file.content.replace(regex, replaceWith);
                totalReplacements += (result.file.content.match(regex) || []).length;
                return get().updateFile(result.file._id, { content: newContent });
            });

            await Promise.all(updatePromises);
            toast.success(`Replaced ${totalReplacements} instance(s) in ${searchResults.length} file(s).`);
        } catch (e) {
            toast.error("Failed to perform replacement.");
        }
    },
      
    setWorkspaceFromGitHub: async (owner, repo) => {
        set({ loading: true });
        const toastId = toast.loading(`Cloning ${owner}/${repo}...`);
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${owner}&repo=${repo}`);
            const ghItems: { path: string; content?: string; isFolder: boolean }[] = await res.json();

            if (!res.ok) throw new Error((ghItems as any).error || "Failed to clone repository.");
            if (ghItems.length === 0) {
                toast.warning("Repository is empty or contains no supported text files.", { id: toastId });
                set({ loading: false });
                return;
            }
            
            const itemsToCreate = ghItems.map(item => ({
                path: item.path,
                name: item.path.split('/').pop()!,
                content: !item.isFolder ? item.content || '' : '',
                isFolder: item.isFolder,
                language: !item.isFolder ? getLanguageConfigFromFilename(item.path).monacoLanguage : 'plaintext',
            }));

            const bulkRes = await fetch('/api/files?action=bulkCreate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToCreate }),
            });

            if (!bulkRes.ok) throw new Error('Failed to save repository to workspace.');
            
            await get().fetchFiles();
            
            const firstFile = get().allFiles.find(f => !f.isFolder);
            const firstFileId = firstFile?._id ?? null;
            get().setActiveFileId(firstFileId);

            toast.success(`Cloned ${repo} successfully.`, { id: toastId });
            return { firstFileId };
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            set({ loading: false });
        }
    },
      
    reset: async () => {
        const res = await fetch('/api/files?action=resetAll', { method: 'DELETE' });
        if (!res.ok) {
            toast.error("Failed to reset workspace.");
            return;
        }
        set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [] });
        toast.success("Workspace has been reset.");
    }
}));

export const useFileSystem = useFileSystemStore;
