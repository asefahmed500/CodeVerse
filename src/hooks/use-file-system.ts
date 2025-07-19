
"use client";

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from 'sonner';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { createJSONStorage, persist } from 'zustand/middleware';

const buildFileTree = (files: FileType[]): FileType[] => {
    const fileMap = new Map<string, FileType>();
    const roots: FileType[] = [];

    files.forEach(file => {
        fileMap.set(file._id, { ...file, children: file.isFolder ? [] : undefined });
    });

    files.forEach(file => {
        if (file.parentId && fileMap.has(file.parentId)) {
            const parent = fileMap.get(file.parentId);
            if (parent && parent.children) {
                 parent.children.push(fileMap.get(file._id)!);
            }
        } else {
            roots.push(fileMap.get(file._id)!);
        }
    });
    
    const sortChildren = (nodes: FileType[]) => {
      if (!nodes) return;
      nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.children) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
};

interface FileSystemState {
  files: FileType[];
  allFiles: FileType[];
  activeFileId: string | null;
  expandedFolders: string[];
  loading: boolean;
  dirtyFileIds: string[];
  savingFileIds: string[];
  lastSavedFileId: string | null;
  lastSavedTime: number | null;
  gitInfo: { owner: string; repo: string } | null;
  
  fetchFiles: () => Promise<void>;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string | null, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string | null) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>) => Promise<FileType | null>;
  updateFileContentLocally: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => Promise<{ nextActiveFileId: string | null }>;
  duplicateFileOrFolder: (fileId: string) => Promise<void>;
  setActiveFileId: (fileId: string | null) => void;
  closeFile: (fileId: string, newActiveFileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  replaceInFiles: (query: string, replaceWith: string) => Promise<void>;
  setWorkspaceFromGitHub: (owner: string, repo: string) => Promise<{ firstFileId: string | null } | void>;
  pullChanges: () => Promise<void>;
  commitChanges: (committedIds: string[]) => void;
  reset: () => Promise<void>;
}

const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
    files: [],
    allFiles: [],
    activeFileId: null,
    expandedFolders: [],
    loading: true,
    dirtyFileIds: [],
    savingFileIds: [],
    lastSavedFileId: null,
    lastSavedTime: null,
    gitInfo: null,

    fetchFiles: async () => {
        set({ loading: true });
        try {
            const res = await fetch('/api/files');
            if (!res.ok) throw new Error('Failed to fetch files');
            const flatFiles: FileType[] = await res.json();
            set({
                files: buildFileTree(flatFiles),
                allFiles: flatFiles.map(f => ({...f, isOpen: false, isActive: false })),
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

        try {
            const res = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFilePayload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create file.");
            }
            
            const createdFile: FileType = await res.json();
            
            set(produce((state: FileSystemState) => {
              state.allFiles.push({ ...createdFile, isOpen: true, isActive: true, language: newFilePayload.language });
              state.files = buildFileTree(state.allFiles);
              state.activeFileId = createdFile._id;
            }));
            
            toast.success(`File "${createdFile.name}" created.`);
            return createdFile;
        } catch(e: any) {
            toast.error(e.message);
            return null;
        }
    },

    createFolder: async (name: string, parentId: string | null = null) => {
        const newFolderPayload = {
            name, content: '', isFolder: true, parentId,
            language: 'plaintext',
        };

        try {
            const res = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFolderPayload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create folder.");
            }

            const newFolder: FileType = await res.json();
            
            set(produce((state: FileSystemState) => {
                state.allFiles.push({ ...newFolder, children: [], isOpen: false, isActive: false });
                state.files = buildFileTree(state.allFiles);
                if (parentId && !state.expandedFolders.includes(parentId!)) {
                    state.expandedFolders.push(parentId!);
                }
            }));

            toast.success(`Folder "${newFolder.name}" created.`);
            return newFolder;
        } catch (e: any) {
            toast.error(e.message);
            return null;
        }
    },

    updateFileContentLocally: (fileId, content) => {
      set(produce((state: FileSystemState) => {
        const file = state.allFiles.find(f => f._id === fileId);
        if (file) {
          file.content = content;
          if (!state.dirtyFileIds.includes(fileId)) {
            state.dirtyFileIds.push(fileId);
          }
        }
      }));
    },

    updateFile: async (fileId, updates) => {
        const isContentUpdate = 'content' in updates;
        
        if ('name' in updates && updates.name) {
            updates.language = getLanguageConfigFromFilename(updates.name).monacoLanguage;
        }
        
        set(produce((state: FileSystemState) => {
            if (!state.savingFileIds.includes(fileId)) {
                state.savingFileIds.push(fileId);
            }
        }));
        
        try {
            const res = await fetch(`/api/files?fileId=${fileId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save file.");
            }
            
            const updatedFile: FileType = await res.json();
            
            set(produce((state: FileSystemState) => {
                const fileIndex = state.allFiles.findIndex(f => f._id === fileId);
                if (fileIndex !== -1) {
                    const existingFile = state.allFiles[fileIndex];
                    state.allFiles[fileIndex] = { ...existingFile, ...updatedFile };

                     // If name changed, language might have too. Ensure local state is consistent.
                    if (updates.name) {
                        state.allFiles[fileIndex].language = getLanguageConfigFromFilename(updates.name).monacoLanguage;
                        state.files = buildFileTree(state.allFiles);
                    }
                }

                if (isContentUpdate) {
                    state.dirtyFileIds = state.dirtyFileIds.filter(id => id !== fileId);
                    state.lastSavedFileId = fileId;
                    state.lastSavedTime = Date.now();
                }
            }));
            
            if (!isContentUpdate) {
              toast.success(`Saved ${updatedFile.name}.`);
            }
            return updatedFile;
        } catch(e: any) {
            toast.error(`Failed to save ${get().findFile(fileId)?.name}: ${e.message}`);
            return null;
        } finally {
            set(produce((state: FileSystemState) => {
                state.savingFileIds = state.savingFileIds.filter(id => id !== fileId);
            }));
        }
    },

    deleteFile: async (fileId) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return { nextActiveFileId: null };

        const toastId = toast.loading(`Deleting ${fileToDelete.name}...`);
        try {
            const res = await fetch(`/api/files?fileId=${fileId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete item.");
            }
            
            const { deletedIds } = await res.json();
            let nextActiveFileId: string | null = get().activeFileId;
            
            set(produce((state: FileSystemState) => {
                const wasActiveFileDeleted = deletedIds.includes(state.activeFileId);
                
                state.allFiles = state.allFiles.filter(f => !deletedIds.includes(f._id));

                if (wasActiveFileDeleted) {
                    const openFiles = state.allFiles.filter(f => f.isOpen && !f.isFolder);
                    if (openFiles.length > 0) {
                        openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                        nextActiveFileId = openFiles[0]._id;
                    } else {
                        nextActiveFileId = null;
                    }
                } else {
                    nextActiveFileId = state.activeFileId;
                }
                
                state.activeFileId = nextActiveFileId;
                state.allFiles.forEach(f => {
                    f.isActive = f._id === nextActiveFileId;
                    if (deletedIds.includes(f._id)) {
                        f.isOpen = false;
                    }
                });
                
                state.files = buildFileTree(state.allFiles);
                state.dirtyFileIds = state.dirtyFileIds.filter(id => !deletedIds.includes(id));
            }));

            toast.success(`Deleted ${fileToDelete.name}.`, { id: toastId });
            return { nextActiveFileId };
        } catch(e: any) {
            toast.error(e.message, { id: toastId });
            return { nextActiveFileId: get().activeFileId };
        }
    },

    duplicateFileOrFolder: async (fileId: string) => {
        const originalNode = get().findFile(fileId);
        if (!originalNode) return;

        const toastId = toast.loading(`Duplicating ${originalNode.name}...`);
        try {
            const res = await fetch('/api/files?action=duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: fileId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to duplicate item.");
            }
            
            const duplicatedItem: FileType & { children?: FileType[] } = await res.json();
            
            const flattenChildren = (node: FileType & { children?: FileType[] }): FileType[] => {
                let flat: FileType[] = [{...node, children: undefined, isOpen: false, isActive: false }];
                if (node.children) {
                    node.children.forEach(child => {
                        flat.push(...flattenChildren(child));
                    });
                }
                return flat;
            };

            const itemsToAdd = flattenChildren(duplicatedItem);
            
            set(produce((state: FileSystemState) => {
                state.allFiles.push(...itemsToAdd);
                state.files = buildFileTree(state.allFiles);
            }));

            toast.success(`Duplicated "${originalNode.name}"`, { id: toastId });
        } catch (e: any) {
            toast.error(e.message, { id: toastId });
        }
    },

    setActiveFileId: (fileId) => {
        set(produce((state: FileSystemState) => {
            if (fileId === state.activeFileId && fileId !== null) return;
            
            state.activeFileId = fileId;

            const fileMap = new Map(state.allFiles.map(f => [f._id, f]));
            const ancestors = new Set<string>();
            let currentFile = fileId ? fileMap.get(fileId) : null;
            
            if (currentFile?.parentId) {
                let parentId = currentFile.parentId;
                while(parentId) {
                    ancestors.add(parentId);
                    const parent = fileMap.get(parentId);
                    parentId = parent?.parentId ?? null;
                }
            }

            state.expandedFolders = [...new Set([...state.expandedFolders, ...ancestors])];
            
            state.allFiles.forEach(f => {
                f.isActive = f._id === fileId;
                if(f.isActive && !f.isFolder) {
                    f.isOpen = true;
                }
            });
        }));
    },
    
    closeFile: (fileId, newActiveFileId) => {
      set(produce((state: FileSystemState) => {
          const fileToClose = state.allFiles.find(f => f._id === fileId);
          if (fileToClose) {
              fileToClose.isOpen = false;
          }
          state.activeFileId = newActiveFileId;
          state.allFiles.forEach(f => {
            f.isActive = f._id === newActiveFileId;
          });
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
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${owner}&repo=${repo}`);
            const ghItems: any = await res.json();

            if (!res.ok) throw new Error(ghItems.error || "Failed to clone repository.");
            if (ghItems.length === 0) {
                toast.warning("Repository is empty or contains no supported text files.");
                set({ loading: false });
                return;
            }
            
            const itemsToCreate = ghItems.map((item: any) => ({
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

             const bulkData = await bulkRes.json();
            if (!bulkRes.ok) {
                throw new Error(bulkData.error || 'Failed to save repository to workspace.');
            }
            
            const createdFiles: FileType[] = bulkData;
            
            const tree = buildFileTree(createdFiles);
            const newFolderIds = createdFiles.filter(f => f.isFolder).map(f => f._id);
            
            set({ 
                files: tree, 
                allFiles: createdFiles.map(f => ({...f, isOpen: false, isActive: false })), 
                dirtyFileIds: [], 
                expandedFolders: newFolderIds,
                gitInfo: { owner, repo }
            });
            
            const firstFile = createdFiles.find((f: FileType) => !f.isFolder);
            const firstFileId = firstFile?._id ?? null;
            get().setActiveFileId(firstFileId);
            
            return { firstFileId };
        } catch (error: any) {
            toast.error(error.message);
            throw error; // Re-throw to be caught by the component
        } finally {
            set({ loading: false });
        }
    },
    
    pullChanges: async () => {
        const { gitInfo, dirtyFileIds, allFiles } = get();
        if (!gitInfo) {
            toast.error("Not a Git repository. Cannot pull changes.");
            throw new Error("Not a Git repository.");
        }

        const toastId = toast.loading(`Pulling changes from ${gitInfo.owner}/${gitInfo.repo}...`);
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${gitInfo.owner}&repo=${gitInfo.repo}`);
            const remoteItems: any[] = await res.json();

            if (!res.ok) throw new Error(remoteItems.error || "Failed to fetch remote repository.");

            const localFileMap = new Map(allFiles.map(f => [get().getPathForFile(f._id), f]));
            const remoteFileMap = new Map(remoteItems.map(f => [`/${f.path}`, f]));
            
            const updates: Promise<any>[] = [];
            let updatedCount = 0;
            let conflictCount = 0;

            remoteFileMap.forEach((remoteFile, path) => {
                const localFile = localFileMap.get(path);
                if (localFile && !localFile.isFolder) {
                    const isDirty = dirtyFileIds.includes(localFile._id);
                    if (!isDirty && localFile.content !== remoteFile.content) {
                        updates.push(get().updateFile(localFile._id, { content: remoteFile.content }));
                        updatedCount++;
                    } else if (isDirty && localFile.content !== remoteFile.content) {
                        conflictCount++;
                    }
                }
            });

            await Promise.all(updates);

            if (conflictCount > 0) {
                 toast.warning(`${conflictCount} files have conflicting changes and were not updated. Please resolve them manually.`, { id: toastId });
            } else if (updatedCount > 0) {
                 toast.success(`Pulled and updated ${updatedCount} files.`, { id: toastId });
            } else {
                 toast.info("Your workspace is already up-to-date.", { id: toastId });
            }
        } catch (error: any) {
            toast.error(`Pull failed: ${error.message}`, { id: toastId });
            throw error;
        }
    },
    
    commitChanges: (committedIds: string[]) => {
        set(produce((state: FileSystemState) => {
            state.dirtyFileIds = state.dirtyFileIds.filter(id => !committedIds.includes(id));
        }));
    },
      
    reset: async () => {
        set({ loading: true });
        try {
            const res = await fetch('/api/files?action=resetAll', { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reset workspace.");
            }
            set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [], dirtyFileIds: [], loading: false, gitInfo: null });
        } catch(e: any) {
            toast.error(e.message);
            set({ loading: false });
        }
    }
  }),
  {
    name: 'codeverse-workspace-info',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ gitInfo: state.gitInfo, expandedFolders: state.expandedFolders }),
  })
);

export const useFileSystem = useFileSystemStore;

    