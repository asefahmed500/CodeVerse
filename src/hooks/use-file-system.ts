"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { toast } from 'sonner';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { produce } from 'immer';

// Helper to get a flattened list of all files
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

// Helper to find a node and its parent in the file tree
const findNodeWithParent = (files: FileType[], fileId: string): { node: FileType | null, parent: FileType | null, collection: FileType[] } => {
    const find = (collection: FileType[], parent: FileType | null): { node: FileType | null, parent: FileType | null, collection: FileType[] } => {
        for (const file of collection) {
            if (file._id === fileId) return { node: file, parent, collection };
            if (file.isFolder && file.children) {
                const found = find(file.children, file);
                if (found.node) return found;
            }
        }
        return { node: null, parent: null, collection };
    };
    return find(files, null);
};


interface FileSystemState {
  files: FileType[];
  activeFileId: string | null;
  expandedFolders: string[];
  allFiles: FileType[];
  activeFile: FileType | null;
  loading: boolean;
  
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string | null, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string | null) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>) => Promise<void>;
  deleteFile: (fileId: string) => Promise<{ nextActiveFileId: string | null }>;
  duplicateFileOrFolder: (fileId: string) => Promise<void>;
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
      activeFileId: null,
      expandedFolders: [],
      allFiles: [],
      activeFile: null,
      loading: false,

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

      createFile: async (name: string, parentId: string | null = null, content: string = '') => {
        const newFile: FileType = {
          _id: uuidv4(), name, content, isFolder: false, parentId: parentId || null,
          language: getLanguageConfigFromFilename(name).monacoLanguage,
          isOpen: true, isActive: true, createdAt: new Date(), updatedAt: new Date(),
        };

        set(produce((state: FileSystemState) => {
            // Deactivate previously active file if there was one
            if (state.activeFile) {
                state.activeFile.isActive = false;
            }
            if (state.activeFileId) {
                const oldActiveNode = findNodeWithParent(state.files, state.activeFileId).node;
                if(oldActiveNode) oldActiveNode.isActive = false;
            }

            // Add the new file to the tree
            if (parentId) {
                const parent = findNodeWithParent(state.files, parentId).node;
                if (parent && parent.isFolder) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFile);
                }
            } else {
                state.files.push(newFile);
            }

            // Set the new file as active
            state.activeFileId = newFile._id;
            state.activeFile = newFile;
            state.allFiles = getFlatFiles(state.files);
        }));
        
        toast.success(`File "${newFile.name}" created.`);
        return newFile;
      },

      createFolder: async (name: string, parentId: string | null = null) => {
        const newFolder: FileType = {
          _id: uuidv4(), name, content: '', isFolder: true, parentId: parentId || null,
          language: 'plaintext', isOpen: false, isActive: false, children: [],
          createdAt: new Date(), updatedAt: new Date(),
        };

        set(produce((state: FileSystemState) => {
            if (parentId) {
                const parent = findNodeWithParent(state.files, parentId).node;
                if (parent && parent.isFolder) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFolder);
                }
            } else {
                state.files.push(newFolder);
            }
            state.allFiles = getFlatFiles(state.files);
        }));

        if (parentId && !get().expandedFolders.includes(parentId)) {
          get().toggleFolder(parentId);
        }
        toast.success(`Folder "${newFolder.name}" created.`);
        return newFolder;
      },
      
      updateFile: async (fileId: string, updates: Partial<FileType>) => {
        set(produce((state: FileSystemState) => {
            const file = findNodeWithParent(state.files, fileId).node;
            if (file) {
                if (updates.name && updates.name !== file.name) {
                    updates.language = getLanguageConfigFromFilename(updates.name).monacoLanguage;
                }
                Object.assign(file, updates, { updatedAt: new Date() });
                state.allFiles = getFlatFiles(state.files);
                if (state.activeFileId === fileId) {
                    state.activeFile = file;
                }
            }
        }));
      },

      deleteFile: async (fileId: string) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return { nextActiveFileId: get().activeFileId };

        const wasActive = get().activeFileId === fileId;
        let nextActiveFileId: string | null = get().activeFileId;

        if (wasActive) {
            const filesAfterDelete = produce(get().files, draft => {
                const { collection } = findNodeWithParent(draft, fileId);
                const index = collection.findIndex(f => f._id === fileId);
                if (index > -1) collection.splice(index, 1);
            });
            const openFiles = getFlatFiles(filesAfterDelete).filter(f => !f.isFolder && f.isOpen);
            openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            nextActiveFileId = openFiles[0]?._id ?? null;
        }

        set(produce((state: FileSystemState) => {
            const { collection } = findNodeWithParent(state.files, fileId);
            const index = collection.findIndex(f => f._id === fileId);
            if (index > -1) collection.splice(index, 1);

            state.activeFileId = nextActiveFileId;
            if (nextActiveFileId) {
                const newActiveFile = findNodeWithParent(state.files, nextActiveFileId).node;
                if (newActiveFile) {
                    newActiveFile.isActive = true;
                }
            }

            state.allFiles = getFlatFiles(state.files);
            state.activeFile = state.allFiles.find(f => f._id === nextActiveFileId) || null;
        }));

        toast.success(`Deleted ${fileToDelete.name}.`);
        return { nextActiveFileId };
      },
      
      duplicateFileOrFolder: async (fileId: string) => {
        const originalNode = get().findFile(fileId);
        if (!originalNode) return;
    
        const duplicateRecursively = (node: FileType, parentId: string | null): FileType => {
          const newId = uuidv4();
          const newNode: FileType = { ...node, _id: newId, parentId, createdAt: new Date(), updatedAt: new Date() };
          if (node.isFolder && node.children) {
            newNode.children = node.children.map(child => duplicateRecursively(child, newId));
          }
          return newNode;
        };
    
        set(produce((state: FileSystemState) => {
            const { collection, node } = findNodeWithParent(state.files, fileId);
            if (node) {
              const duplicatedNode = duplicateRecursively(node, node.parentId);
              let newName = node.name;
              const extIndex = newName.lastIndexOf('.');
              const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
              const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
              
              let counter = 1;
              do {
                newName = `${baseName} copy${counter > 1 ? ` ${counter}` : ''}${extension}`;
                counter++;
              } while (collection.some(f => f.name === newName));
      
              duplicatedNode.name = newName;
              collection.push(duplicatedNode);
              state.allFiles = getFlatFiles(state.files);
            }
        }));
    
        toast.success(`Duplicated "${originalNode.name}"`);
      },

      setActiveFileId: (fileId: string | null) => {
        set(produce((state: FileSystemState) => {
            if (state.activeFileId === fileId) return;
    
            // Deactivate old file
            if (state.activeFileId) {
                const oldActive = findNodeWithParent(state.files, state.activeFileId).node;
                if (oldActive) oldActive.isActive = false;
            }
    
            // Activate new file
            const newActive = fileId ? findNodeWithParent(state.files, fileId).node : null;
            if (newActive) {
                newActive.isActive = true;
                if (!newActive.isFolder) {
                    newActive.isOpen = true;
                }
            }
            
            state.activeFileId = fileId;
            state.activeFile = newActive;
            state.allFiles = getFlatFiles(state.files); // Recalculate just in case open status changed
        }));
      },

      toggleFolder: (folderId: string) => {
        set(produce((state: FileSystemState) => {
            const index = state.expandedFolders.indexOf(folderId);
            if (index > -1) state.expandedFolders.splice(index, 1);
            else state.expandedFolders.push(folderId);
        }));
      },

      searchFiles: async (query: string): Promise<SearchResult[]> => {
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

      replaceInFiles: async (query: string, replaceWith: string) => {
        try {
          const regex = new RegExp(query, 'g');
          const filesWithMatches = get().allFiles.filter(f => !f.isFolder && f.content && new RegExp(query, 'g').test(f.content));
          if (filesWithMatches.length === 0) {
            toast.info("No occurrences found to replace.");
            return;
          }

          let totalReplacements = 0;
          set(produce((state: FileSystemState) => {
              filesWithMatches.forEach(fileData => {
                  const liveFile = findNodeWithParent(state.files, fileData._id).node;
                  if (liveFile && liveFile.content) {
                    const originalContent = liveFile.content;
                    const newContent = originalContent.replace(regex, replaceWith);
                    totalReplacements += (originalContent.match(regex) || []).length;
                    liveFile.content = newContent;
                  }
              });
              state.allFiles = getFlatFiles(state.files);
          }));
  
          toast.success(`Replaced ${totalReplacements} instance(s) in ${filesWithMatches.length} file(s).`);
        } catch (e) {
          toast.error("Invalid regular expression in search query.");
        }
      },
      
      setWorkspaceFromGitHub: async (owner: string, repo: string) => {
        set({ loading: true });
        const toastId = toast.loading(`Cloning ${owner}/${repo}...`);
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${owner}&repo=${repo}`);
            const ghItems: { path: string; content?: string; type: 'file' | 'dir' }[] = await res.json();

            if (!res.ok) throw new Error((ghItems as any).error || "Failed to clone repository.");
            if (ghItems.length === 0) {
              toast.warning("Repository is empty or contains no supported text files.");
              set({ loading: false });
              toast.dismiss(toastId);
              return;
            }
            
            const newFileTree: FileType[] = [];
            const dirMap = new Map<string, FileType>();
            ghItems.sort((a, b) => a.path.localeCompare(b.path));

            for (const item of ghItems) {
                const parts = item.path.split('/');
                const itemName = parts.pop()!;
                const parentPath = parts.join('/');
                const parent = parentPath ? dirMap.get(parentPath) : null;

                const newItem: FileType = {
                  _id: uuidv4(), name: itemName, parentId: parent?._id || null,
                  content: item.type === 'file' ? item.content || '' : '',
                  isFolder: item.type === 'dir',
                  language: item.type === 'file' ? getLanguageConfigFromFilename(itemName).monacoLanguage : 'plaintext',
                  children: item.type === 'dir' ? [] : undefined,
                  isOpen: false, isActive: false, createdAt: new Date(), updatedAt: new Date(),
                };

                if (newItem.isFolder) dirMap.set(item.path, newItem);

                if (parent) parent.children?.push(newItem);
                else newFileTree.push(newItem);
            }
            
            get().reset();
            
            const firstFile = getFlatFiles(newFileTree).find(f => !f.isFolder);

            set(produce((state: FileSystemState) => {
                state.files = newFileTree;
                state.allFiles = getFlatFiles(newFileTree);
                if (firstFile) {
                    firstFile.isOpen = true;
                    firstFile.isActive = true;
                    state.activeFileId = firstFile._id;
                    state.activeFile = firstFile;
                }
            }));
            
            toast.success(`Cloned ${repo} successfully.`, { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            set({ loading: false });
        }
      },
      
      reset: () => {
        set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [], activeFile: null, loading: false });
      }
    }),
    {
      name: 'codeverse-file-system-v6', // Incremented version to avoid state conflicts
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.loading = false;
            // On rehydration, re-calculate derived state to ensure consistency
            const allFiles = getFlatFiles(state.files);
            state.allFiles = allFiles;
            state.activeFile = allFiles.find(f => f._id === state.activeFileId) || null;
        }
      }
    }
  )
);

export const useFileSystem = useFileSystemStore;
