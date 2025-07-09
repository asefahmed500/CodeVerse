
"use client";

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from 'sonner';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { getLanguageConfigFromFilename } from '@/config/languages';

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
  dirtyFileIds: string[];
  
  fetchFiles: () => Promise<void>;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string | null, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string | null) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>) => Promise<void>;
  updateFileContentLocally: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => Promise<{ nextActiveFileId: string | null }>;
  duplicateFileOrFolder: (fileId: string) => Promise<void>;
  setActiveFileId: (fileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  replaceInFiles: (query: string, replaceWith: string) => Promise<void>;
  setWorkspaceFromGitHub: (owner: string, repo: string) => Promise<{ firstFileId: string | null } | void>;
  commitChanges: () => void;
  reset: () => Promise<void>;
}

const useFileSystemStore = create<FileSystemState>((set, get) => ({
    files: [],
    allFiles: [],
    activeFileId: null,
    expandedFolders: [],
    loading: true,
    dirtyFileIds: [],

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
                dirtyFileIds: [],
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
          state.allFiles.push(createdFile);
          state.files = buildFileTree(state.allFiles);
        }));
        
        get().setActiveFileId(createdFile._id);
        toast.success(`File "${createdFile.name}" created.`);
        return get().findFile(createdFile._id);
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
            state.allFiles.push({ ...newFolder, children: [] });
            state.files = buildFileTree(state.allFiles);
            if (parentId && !state.expandedFolders.includes(parentId!)) {
                state.expandedFolders.push(parentId!);
            }
        }));

        toast.success(`Folder "${newFolder.name}" created.`);
        return get().findFile(newFolder._id);
    },

    updateFileContentLocally: (fileId, content) => {
      set(produce((state: FileSystemState) => {
        const file = state.allFiles.find(f => f._id === fileId);
        if (file) {
          file.content = content;
        }
        if (!state.dirtyFileIds.includes(fileId)) {
          state.dirtyFileIds.push(fileId);
        }
      }));
    },

    updateFile: async (fileId, updates) => {
        const nameChanged = 'name' in updates;
        if (nameChanged && updates.name) {
            updates.language = getLanguageConfigFromFilename(updates.name).monacoLanguage;
        }

        set(produce((state: FileSystemState) => {
            const file = state.allFiles.find(f => f._id === fileId);
            if (file) {
                Object.assign(file, updates);
            }
            if(nameChanged) {
                state.files = buildFileTree(state.allFiles);
            }
        }));

        const res = await fetch(`/api/files?fileId=${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        
        if (!res.ok) {
            toast.error("Failed to save file.");
            get().fetchFiles(); // Re-sync with server on failure
            return;
        }
        
        if (!('content' in updates)) {
          const updatedFile = await res.json();
          toast.success(`Saved ${updatedFile.name}.`);
        }
    },

    deleteFile: async (fileId) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return { nextActiveFileId: null };

        let nextActiveFileId: string | null = get().activeFileId;
        const wasActive = get().activeFileId === fileId;

        const res = await fetch(`/api/files?fileId=${fileId}`, { method: 'DELETE' });
        if (!res.ok) {
            toast.error("Failed to delete item.");
            return { nextActiveFileId: get().activeFileId };
        }
        
        const idsToDelete = [fileId];
        if (fileToDelete.isFolder) {
            const findDescendants = (id: string, allFiles: FileType[]) => {
                const children = allFiles.filter(f => f.parentId === id);
                for (const child of children) {
                    idsToDelete.push(child._id);
                    if (child.isFolder) {
                        findDescendants(child._id, allFiles);
                    }
                }
            };
            findDescendants(fileId, get().allFiles);
        }
        
        set(produce((state: FileSystemState) => {
            state.allFiles = state.allFiles.filter(f => !idsToDelete.includes(f._id));
            state.files = buildFileTree(state.allFiles);
        }));

        if (wasActive) {
            const openFiles = get().allFiles.filter(f => !f.isFolder && f.isOpen);
            openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            nextActiveFileId = openFiles[0]?._id ?? null;
        }
        
        toast.success(`Deleted ${fileToDelete.name}.`);
        return { nextActiveFileId };
    },

    duplicateFileOrFolder: async (fileId: string) => {
        const originalNode = get().findFile(fileId);
        if (!originalNode) return;

        toast.loading("Duplicating...");
        const res = await fetch('/api/files?action=duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId: fileId })
        });

        if (!res.ok) {
            toast.error("Failed to duplicate item.");
            return;
        }

        await get().fetchFiles();
        toast.success(`Duplicated "${originalNode.name}"`);
    },

    setActiveFileId: (fileId) => {
        set(produce((state: FileSystemState) => {
            if (state.activeFileId === fileId) {
                const newActive = fileId ? state.allFiles.find(f => f._id === fileId) : null;
                if (newActive && !newActive.isFolder) newActive.isOpen = true;
                return;
            };

            const oldActive = state.allFiles.find(f => f._id === state.activeFileId);
            if (oldActive) oldActive.isActive = false;

            const newActive = fileId ? state.allFiles.find(f => f._id === fileId) : null;
            if (newActive) {
                newActive.isActive = true;
                if (!newActive.isFolder) newActive.isOpen = true;
            }
            state.activeFileId = fileId;
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
            set({ dirtyFileIds: [] });

            toast.success(`Cloned ${repo} successfully.`, { id: toastId });
            return { firstFileId };
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            set({ loading: false });
        }
    },
    
    commitChanges: () => {
        set({ dirtyFileIds: [] });
    },
      
    reset: async () => {
        set({ loading: true });
        const res = await fetch('/api/files?action=resetAll', { method: 'DELETE' });
        if (!res.ok) {
            toast.error("Failed to reset workspace.");
            set({ loading: false });
            return;
        }
        set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [], dirtyFileIds: [], loading: false });
    }
}));

export const useFileSystem = useFileSystemStore;
