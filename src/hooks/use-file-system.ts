"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { toast } from 'sonner';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { produce } from 'immer';

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
  
  _setFiles: (files: FileType[]) => void;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>, options?: { optimistic?: boolean, noUpdate?: boolean }) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
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

      _setFiles: (files: FileType[]) => {
        const allFiles = getFlatFiles(files);
        const activeFileId = get().activeFileId;
        const activeFile = allFiles.find(f => f._id === activeFileId) || null;
        set({ files, allFiles, activeFile, loading: false });
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

      createFile: async (name: string, parentId?: string, content: string = '') => {
        const newFile: FileType = {
          _id: uuidv4(), name, content, isFolder: false, parentId: parentId || null,
          language: getLanguageConfigFromFilename(name).monacoLanguage,
          isOpen: true, isActive: true, createdAt: new Date(), updatedAt: new Date(),
        };

        const files = produce(get().files, draft => {
            if (parentId) {
                const parent = getFlatFiles(draft).find(f => f._id === parentId && f.isFolder);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFile);
                }
            } else {
                draft.push(newFile);
            }
        });
        
        get()._setFiles(files);
        get().setActiveFileId(newFile._id);
        toast.success(`File "${newFile.name}" created.`);
        return newFile;
      },

      createFolder: async (name: string, parentId?: string) => {
        const newFolder: FileType = {
          _id: uuidv4(), name, content: '', isFolder: true, parentId: parentId || null,
          language: 'plaintext', isOpen: false, isActive: false, children: [],
          createdAt: new Date(), updatedAt: new Date(),
        };

         const files = produce(get().files, draft => {
            if (parentId) {
                const parent = getFlatFiles(draft).find(f => f._id === parentId);
                if (parent && parent.isFolder) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(newFolder);
                }
            } else {
                draft.push(newFolder);
            }
        });

        get()._setFiles(files);
        if (parentId && !get().expandedFolders.includes(parentId)) {
          get().toggleFolder(parentId);
        }
        toast.success(`Folder "${newFolder.name}" created.`);
        return newFolder;
      },
      
      updateFile: async (fileId: string, updates: Partial<FileType>, options = {}) => {
        const files = produce(get().files, draft => {
            const file = getFlatFiles(draft).find(f => f._id === fileId);
            if (file) {
                Object.assign(file, updates, { updatedAt: new Date() });
            }
        });
        
        if (!options.noUpdate) get()._setFiles(files);
        else set({ files });
      },

      deleteFile: async (fileId: string) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return;

        const files = produce(get().files, draft => {
            const { collection } = findNodeWithParent(draft, fileId);
            const index = collection.findIndex(f => f._id === fileId);
            if (index > -1) collection.splice(index, 1);
        });

        get()._setFiles(files);
        if (get().activeFileId === fileId) get().setActiveFileId(null);
        toast.success(`Deleted ${fileToDelete.name}.`);
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
    
        const files = produce(get().files, draft => {
          const { collection, node } = findNodeWithParent(draft, fileId);
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
          }
        });
    
        get()._setFiles(files);
        toast.success(`Duplicated "${originalNode.name}"`);
      },
      
      setActiveFileId: (fileId: string | null) => {
        if (get().activeFileId === fileId) return;

        const files = produce(get().files, draft => {
          getFlatFiles(draft).forEach(f => {
            f.isActive = f._id === fileId;
          });
        });
        // Set activeFileId first, then call _setFiles to update derived state
        set({ activeFileId: fileId });
        get()._setFiles(files);
      },

      toggleFolder: (folderId: string) => {
        set(produce(state => {
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
          const files = produce(get().files, draft => {
              filesWithMatches.forEach(fileData => {
                  const liveFile = getFlatFiles(draft).find(f => f._id === fileData._id);
                  if (liveFile && liveFile.content) {
                    const originalContent = liveFile.content;
                    const newContent = originalContent.replace(regex, replaceWith);
                    totalReplacements += (originalContent.match(regex) || []).length;
                    liveFile.content = newContent;
                  }
              });
          });
  
          get()._setFiles(files);
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
            get()._setFiles(newFileTree);

            const firstFile = get().allFiles.find(f => !f.isFolder);
            if(firstFile) {
                get().setActiveFileId(firstFile._id);
                get().updateFile(firstFile._id, { isOpen: true, isActive: true });
            }
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
      name: 'codeverse-file-system-v5', 
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.loading = false;
      }
    }
  )
);

export const useFileSystem = useFileSystemStore;
