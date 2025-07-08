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
  allFiles: FileType[]; // Derived state, kept for quick lookups
  activeFile: FileType | null; // Derived state for convenience
  
  // Actions
  _setFiles: (files: FileType[]) => void;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string, content?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string) => Promise<FileType | null>;
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
      activeFileId: null,
      expandedFolders: [],
      allFiles: [],
      activeFile: null,

      _setFiles: (files: FileType[]) => {
        const allFiles = getFlatFiles(files);
        const activeFileId = get().activeFileId;
        const activeFile = allFiles.find(f => f._id === activeFileId) || null;
        set({ files, allFiles, activeFile });
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
            // This is a safeguard against orphaned files, should not happen in normal operation
            if (!parent) return `/${file.name}`; 
            const parentPath = buildPath(parent._id);
            // Handle root case properly
            return parentPath === '/' ? `/${parent.name}/${file.name}` : `${parentPath}/${file.name}`;
        };

        const file = fileMap.get(fileId);
        if(!file) return '';
        if(!file.parentId) return `/${file.name}`;
        
        // A slightly different approach to ensure correctness
        const pathParts: string[] = [file.name];
        let currentParentId = file.parentId;
        while(currentParentId) {
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
          _id: uuidv4(),
          name,
          content,
          isFolder: false,
          parentId: parentId || null,
          language: getLanguageConfigFromFilename(name).monacoLanguage,
          isOpen: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const files = produce(get().files, draft => {
            getFlatFiles(draft).forEach(f => f.isActive = false); // Deactivate all other files
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
                
                if (updates.isActive) {
                    getFlatFiles(draft).forEach(f => {
                        if (f._id !== fileId) f.isActive = false;
                    });
                }
            }
        });
        
        if (!options.noUpdate) {
            get()._setFiles(files);
        } else {
          // For optimistic updates that don't trigger a full recalculation immediately
          set({ files });
        }
      },

      deleteFile: async (fileId: string) => {
        const fileToDelete = get().findFile(fileId);
        if (!fileToDelete) return;

        const files = produce(get().files, draft => {
            const { parent, collection, node } = findNodeWithParent(draft, fileId);
            if (node) {
                const index = collection.findIndex(f => f._id === fileId);
                if (index > -1) {
                    collection.splice(index, 1);
                }
            }
        });

        get()._setFiles(files);
        if (get().activeFileId === fileId) {
            get().setActiveFileId(null);
        }
        toast.success(`Deleted ${fileToDelete.name}.`);
      },
      
      setActiveFileId: (fileId: string | null) => {
        if (get().activeFileId === fileId) return;
        set({ activeFileId: fileId });

        const files = produce(get().files, draft => {
          getFlatFiles(draft).forEach(f => {
            f.isActive = f._id === fileId;
          });
        });
        get()._setFiles(files);
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

          try {
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
  
                // Reset regex state for the next test
                regex.lastIndex = 0;
                if (regex.test(file.name) || contentMatches.length > 0) {
                    results.push({ file, matches: contentMatches });
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
          const filesToUpdate = get().allFiles.filter(f => !f.isFolder && f.content && regex.test(f.content));
          regex.lastIndex = 0; // Reset
          
          let totalReplacements = 0;
          const files = produce(get().files, draft => {
              filesToUpdate.forEach(fileData => {
                  const liveFile = getFlatFiles(draft).find(f => f._id === fileData._id);
                  if (liveFile) {
                    const originalContent = liveFile.content;
                    const replacementCount = (originalContent.match(regex) || []).length;
                    if(replacementCount > 0){
                        liveFile.content = originalContent.replace(regex, replaceWith);
                        totalReplacements += replacementCount;
                    }
                  }
              })
          });
  
          get()._setFiles(files);
          if (totalReplacements > 0) {
              toast.success(`Replaced ${totalReplacements} instance(s) in ${filesToUpdate.length} file(s).`);
          } else {
              toast.info("No occurrences found to replace.");
          }
        } catch (e) {
          toast.error("Invalid regular expression in search query.");
        }
      },
      
      setWorkspaceFromGitHub: async (owner: string, repo: string) => {
        try {
            const res = await fetch(`/api/github?action=getRepoTree&owner=${owner}&repo=${repo}`);
            const ghFiles = await res.json();
            if (!res.ok) throw new Error(ghFiles.error || "Failed to clone repository.");

            if (ghFiles.length === 0) {
              toast.warning("Repository is empty or contains no supported text files.");
              return;
            }
            
            // Build file tree from flat path list
            const newFileTree: FileType[] = [];
            const dirMap = new Map<string, FileType>();

            // Sort files to ensure directories are created before files inside them
            ghFiles.sort((a: any, b: any) => a.path.localeCompare(b.path));

            for (const fileData of ghFiles) {
                const parts = fileData.path.split('/');
                const fileName = parts.pop()!;
                const dirPath = parts.join('/');
                
                const parent = dirPath ? dirMap.get(dirPath) : null;

                const newItem: FileType = {
                  _id: uuidv4(),
                  name: fileName,
                  content: fileData.content || '',
                  isFolder: fileData.content === undefined, // Simple check if it's a directory
                  parentId: parent ? parent._id : null,
                  language: fileData.content !== undefined ? getLanguageConfigFromFilename(fileName).monacoLanguage : 'plaintext',
                  isOpen: false,
                  isActive: false,
                  children: fileData.content === undefined ? [] : undefined,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                if (newItem.isFolder) {
                  dirMap.set(fileData.path, newItem);
                }

                if (parent) {
                  parent.children?.push(newItem);
                } else {
                  newFileTree.push(newItem);
                }
            }
            
            get().reset(); // Clear existing workspace
            get()._setFiles(newFileTree);

            const firstFile = get().allFiles.find(f => !f.isFolder);
            if(firstFile) {
                get().setActiveFileId(firstFile._id);
                get().updateFile(firstFile._id, { isOpen: true, isActive: true });
                return firstFile._id; // To allow redirection
            }
        } catch (error: any) {
            toast.error(error.message);
        }
      },
      
      reset: () => {
        set({ files: [], allFiles: [], activeFileId: null, expandedFolders: [], activeFile: null });
      }
    }),
    {
      name: 'codeverse-file-system-local-v4', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export const useFileSystem = useFileSystemStore;
