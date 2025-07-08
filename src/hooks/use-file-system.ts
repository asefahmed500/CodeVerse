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

// Find a node and its parent in the tree
const findNodeWithParent = (files: FileType[], fileId: string): { node: FileType | null, parent: FileType | null } => {
    for (const file of files) {
        if (file._id === fileId) return { node: file, parent: null };
        if (file.isFolder && file.children) {
            for (const child of file.children) {
                if (child._id === fileId) return { node: child, parent: file };
                const found = findNodeWithParent([child], fileId);
                if(found.node) return found;
            }
        }
    }
    return { node: null, parent: null };
};


interface FileSystemState {
  files: FileType[];
  loading: boolean;
  activeFileId: string | null;
  expandedFolders: string[];
  allFiles: FileType[]; // Derived state, kept for quick lookups
  
  // Actions
  _setFiles: (files: FileType[]) => void;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  updateFile: (fileId: string, updates: Partial<FileType>, options?: { optimistic?: boolean, noUpdate?: boolean }) => Promise<void>;
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
      loading: false, // Start with false for local storage
      activeFileId: null,
      expandedFolders: [],
      allFiles: [],

      _setFiles: (files: FileType[]) => {
        const allFiles = getFlatFiles(files);
        set({ files, allFiles });
      },

      findFile: (fileId: string) => {
        if (!fileId) return null;
        return get().allFiles.find(f => f._id === fileId) || null;
      },
      
      getPathForFile: (fileId: string): string => {
        const fileMap = new Map(get().allFiles.map(f => [f._id, f]));
        const buildPath = (fId: string): string => {
            const file = fileMap.get(fId);
            if (!file) return '';
            if (!file.parentId) return `/${file.name}`;
            const parent = fileMap.get(file.parentId);
            if (!parent) return `/${file.name}`;
            const parentPath = buildPath(parent._id);
            return parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;
        };
        return buildPath(fileId);
      },

      createFile: async (name: string, parentId?: string) => {
        const newFile: FileType = {
          _id: uuidv4(),
          name,
          content: '',
          isFolder: false,
          parentId: parentId || null,
          language: getLanguageConfigFromFilename(name).monacoLanguage,
          isOpen: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(produce(draft => {
            const allFiles = getFlatFiles(draft.files);
            allFiles.forEach(f => f.isActive = false); // Deactivate all other files
            if (parentId) {
                const parent = getFlatFiles(draft.files).find(f => f._id === parentId);
                if (parent && parent.isFolder) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFile);
                }
            } else {
                draft.files.push(newFile);
            }
        }));
        get()._setFiles(get().files); // Recalculate allFiles
        
        get().setActiveFileId(newFile._id);
        toast.success(`File "${newFile.name}" created.`);
        return newFile;
      },

      createFolder: async (name: string, parentId?: string) => {
        const newFolder: FileType = {
          _id: uuidv4(),
          name,
          content: '',
          isFolder: true,
          parentId: parentId || null,
          language: 'plaintext',
          isOpen: false,
          isActive: false,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

         set(produce(draft => {
            if (parentId) {
                const parent = getFlatFiles(draft.files).find(f => f._id === parentId);
                if (parent && parent.isFolder) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFolder);
                }
            } else {
                draft.files.push(newFolder);
            }
        }));
        get()._setFiles(get().files);
        if (parentId) get().toggleFolder(parentId);
        toast.success(`Folder "${newFolder.name}" created.`);
      },
      
      updateFile: async (fileId: string, updates: Partial<FileType>, options = {}) => {
        set(produce(draft => {
            const file = getFlatFiles(draft.files).find(f => f._id === fileId);
            if (file) {
                Object.assign(file, updates, { updatedAt: new Date() });
                
                // If making active, deactivate others
                if (updates.isActive) {
                    getFlatFiles(draft.files).forEach(f => {
                        if (f._id !== fileId) f.isActive = false;
                    });
                }
            }
        }));
        if (!options.noUpdate) {
            get()._setFiles(get().files);
        }
      },

      deleteFile: async (fileId: string) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return;

        set(produce(draft => {
            const deleteRecursively = (id: string) => {
                const { node, parent } = findNodeWithParent(draft.files, id);
                if (!node) return;

                if (node.isFolder && node.children) {
                    [...node.children].forEach(child => deleteRecursively(child._id));
                }
                
                const targetArray = parent ? parent.children : draft.files;
                const index = targetArray.findIndex(f => f._id === id);
                if (index > -1) {
                    targetArray.splice(index, 1);
                }
            };
            deleteRecursively(fileId);
        }));

        get()._setFiles(get().files); // Recalculate flat files
        if (get().activeFileId === fileId) {
            get().setActiveFileId(null);
        }
        toast.success(`Deleted ${fileToDelete.name}.`);
      },
      
      setActiveFileId: (fileId: string | null) => {
        if (get().activeFileId === fileId) return;
        set({ activeFileId: fileId });
        if (fileId) {
            get().updateFile(fileId, { isActive: true });
        }
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
          const allFiles = get().allFiles;
          const results: SearchResult[] = [];
          const regex = new RegExp(query, 'gi');

          for (const file of allFiles) {
              if (file.isFolder) continue;

              const contentMatches: SearchMatch[] = [];
              if (file.content) {
                  const lines = file.content.split('\n');
                  lines.forEach((line, index) => {
                      if (regex.test(line)) {
                          contentMatches.push({ lineNumber: index + 1, lineContent: line });
                      }
                  });
              }

              if (regex.test(file.name) || contentMatches.length > 0) {
                  results.push({ file, matches: contentMatches });
              }
          }
          return results;
      },

      replaceInFiles: async (query: string, replaceWith: string) => {
        const filesToUpdate = get().allFiles.filter(f => !f.isFolder && f.content && f.content.includes(query));
        const regex = new RegExp(query, 'g');
        
        let totalReplacements = 0;
        set(produce(draft => {
            filesToUpdate.forEach(file => {
                const originalContent = file.content;
                const replacementCount = (originalContent.match(regex) || []).length;
                if(replacementCount > 0){
                    const liveFile = getFlatFiles(draft.files).find(f => f._id === file._id);
                    if(liveFile) {
                        liveFile.content = originalContent.replace(regex, replaceWith);
                        totalReplacements += replacementCount;
                    }
                }
            })
        }));

        get()._setFiles(get().files);
        if (totalReplacements > 0) {
            toast.success(`Replaced ${totalReplacements} instance(s) in ${filesToUpdate.length} file(s).`);
        } else {
            toast.info("No occurrences found to replace.");
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
            
            // Build file tree from flat path list
            const newFileTree: FileType[] = [];
            const dirMap = new Map<string, FileType>();

            for (const fileData of ghFiles) {
                const parts = fileData.path.split('/');
                let currentParentId: string | null = null;
                let currentPath = '';

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = i === 0 ? part : `${currentPath}/${part}`;
                    const isFolder = i < parts.length - 1;

                    if (!dirMap.has(currentPath)) {
                        const newItem: FileType = {
                            _id: uuidv4(),
                            name: part,
                            content: isFolder ? '' : fileData.content,
                            isFolder,
                            parentId: currentParentId,
                            language: isFolder ? 'plaintext' : getLanguageConfigFromFilename(part).monacoLanguage,
                            isOpen: false,
                            isActive: false,
                            children: isFolder ? [] : undefined,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        dirMap.set(currentPath, newItem);

                        const parent = currentParentId ? dirMap.get(parts.slice(0, i).join('/')) : null;
                        if (parent) {
                            parent.children?.push(newItem);
                        } else {
                            newFileTree.push(newItem);
                        }
                    }
                    if (isFolder) {
                        currentParentId = dirMap.get(currentPath)!._id;
                    }
                }
            }
            
            set({ files: newFileTree, allFiles: Array.from(dirMap.values()) });
            const firstFile = get().allFiles.find(f => !f.isFolder);
            if(firstFile) {
                get().setActiveFileId(firstFile._id);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            set({ loading: false });
        }
      },
      
      reset: () => {
        set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [] });
      }
    }),
    {
      name: 'codeverse-file-system-local-v3', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export const useFileSystem = useFileSystemStore;
