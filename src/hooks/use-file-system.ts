"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FileType, SearchResult, SearchMatch } from '@/types';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { toast } from 'sonner';

// --- Helper Functions ---
const findNodeInTree = (files: FileType[], fileId: string): FileType | null => {
  for (const file of files) {
      if (file._id === fileId) return file;
      if (file.isFolder && file.children) {
          const found = findNodeInTree(file.children, fileId);
          if (found) return found;
      }
  }
  return null;
};

const updateFileInTree = (files: FileType[], fileId: string, updates: Partial<FileType>): FileType[] => {
  return files.map(file => {
    if (file._id === fileId) {
      return { ...file, ...updates, updatedAt: new Date() };
    }
    if (file.isFolder && file.children) {
      return { ...file, children: updateFileInTree(file.children, fileId, updates) };
    }
    return file;
  });
};

const addFileToTree = (files: FileType[], newFile: FileType): FileType[] => {
  if (!newFile.parentId) {
    return [...files, newFile];
  }
  return files.map(file => {
    if (file._id === newFile.parentId) {
      return { ...file, children: [...(file.children || []), newFile] };
    }
    if (file.isFolder && file.children) {
      return { ...file, children: addFileToTree(file.children, newFile) };
    }
    return file;
  });
};

const deleteFileFromTree = (files: FileType[], fileId: string): FileType[] => {
    return files.filter(file => file._id !== fileId).map(file => {
      if (file.isFolder && file.children) {
        return { ...file, children: deleteFileFromTree(file.children, fileId) };
      }
      return file;
    });
};

const deactivateAllFiles = (files: FileType[]): FileType[] => {
    return files.map(file => {
        let newFile = { ...file };
        if (!newFile.isFolder) {
          newFile.isActive = false;
        }
        if (newFile.isFolder && newFile.children) {
            newFile.children = deactivateAllFiles(newFile.children);
        }
        return newFile;
    });
}

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
  originalFileContents: Record<string, string>; // For tracking dirty state
  activeFileId: string | null;
  expandedFolders: string[];
  loading: boolean;
  findFile: (fileId: string) => FileType | null;
  getPathForFile: (fileId: string) => string;
  createFile: (name: string, parentId?: string) => FileType;
  createFolder: (name: string, parentId?: string) => void;
  updateFile: (fileId: string, updates: Partial<FileType>) => void;
  deleteFile: (fileId: string) => void;
  setActiveFileId: (fileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  searchFiles: (query: string) => SearchResult[];
  replaceInFiles: (query: string, replaceWith: string) => { filesUpdated: number, replacements: number };
  reset: () => void;
  setWorkspace: (clonedFiles: { path: string, content: string }[]) => void;
  getDirtyFiles: () => FileType[];
  commit: (message: string) => void;
}

const initialWelcomeFile: FileType = {
    _id: 'welcome-file',
    name: 'Welcome.md',
    content: '# Welcome to CodeVerse!\n\nThis is a cloud-based IDE. Sign in and clone a GitHub repository to get started.\n\nHappy coding!',
    isFolder: false,
    parentId: null,
    language: 'markdown',
    isOpen: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: []
};

const initialState = {
    files: [initialWelcomeFile],
    originalFileContents: { 'welcome-file': initialWelcomeFile.content },
    activeFileId: 'welcome-file',
    expandedFolders: [],
    loading: true,
};


export const useFileSystem = create<FileSystemState>()(
  persist(
    (set, get) => ({
      ...initialState,
      findFile: (fileId: string) => {
        if (!fileId) return null;
        return findNodeInTree(get().files, fileId);
      },
      getPathForFile: (fileId: string): string => {
        const fileMap = new Map(flattenFiles(get().files).map(f => [f._id, f]));
        const buildPath = (fId: string): string => {
            const file = fileMap.get(fId);
            if (!file) return '';
            if (!file.parentId) return `/${file.name}`;
            const parentPath = buildPath(file.parentId);
            return parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;
        };
        return buildPath(fileId);
      },
      createFile: (name: string, parentId?: string) => {
        const { files, findFile } = get();
        const parentChildren = parentId ? findFile(parentId)?.children : files;
        if (parentId && !findFile(parentId)?.isFolder) {
            toast.error("Cannot create file in a file.");
            return null!;
        }

        let finalName = name;
        let counter = 1;
        const nameParts = name.split('.');
        const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
        const baseName = nameParts.join('.');

        while (parentChildren?.some(f => f.name === finalName)) {
            finalName = `${baseName}-${counter}${ext}`;
            counter++;
        }

        const newFile: FileType = {
          _id: uuidv4(),
          name: finalName,
          content: '',
          isFolder: false,
          parentId: parentId || null,
          language: getLanguageConfigFromFilename(finalName).monacoLanguage,
          isOpen: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
            files: addFileToTree(deactivateAllFiles(state.files), newFile),
            activeFileId: newFile._id,
            originalFileContents: { ...state.originalFileContents, [newFile._id]: newFile.content },
            expandedFolders: parentId ? [...new Set([...state.expandedFolders, parentId])] : state.expandedFolders
        }));

        return newFile;
      },
      createFolder: (name: string, parentId?: string) => {
        const { files, findFile } = get();
        const parentChildren = parentId ? findFile(parentId)?.children : files;
        if (parentId && !findFile(parentId)?.isFolder) {
            toast.error("Cannot create folder in a file.");
            return;
        }

        let finalName = name;
        let counter = 1;
        while (parentChildren?.some(f => f.name === finalName)) {
            finalName = `${name}-${counter}`;
            counter++;
        }

        const newFolder: FileType = {
            _id: uuidv4(),
            name: finalName,
            content: '',
            isFolder: true,
            parentId: parentId || null,
            language: 'plaintext',
            isOpen: false,
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [],
        };
        
        set(state => ({
            files: addFileToTree(state.files, newFolder),
            expandedFolders: parentId ? [...new Set([...state.expandedFolders, parentId])] : state.expandedFolders
        }));
      },
      updateFile: (fileId: string, updates: Partial<FileType>) => {
        set(state => {
            let tree = state.files;
            if (updates.isActive) {
                tree = deactivateAllFiles(tree);
                return { files: updateFileInTree(tree, fileId, updates), activeFileId: fileId };
            }
            return { files: updateFileInTree(tree, fileId, updates) };
        });
      },
      deleteFile: (fileId: string) => {
        const { files, activeFileId, findFile } = get();
        const fileToDelete = findFile(fileId);
        if (!fileToDelete) return;

        const openFiles = flattenFiles(files).filter(f => !f.isFolder && f.isOpen && f._id !== fileId);
        openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        let newActiveId = null;
        if (activeFileId === fileId) {
            newActiveId = openFiles.length > 0 ? openFiles[0]._id : null;
        } else {
            newActiveId = activeFileId;
        }

        set(state => {
            const newOriginals = {...state.originalFileContents};
            delete newOriginals[fileId];
            return {
                files: deleteFileFromTree(state.files, fileId),
                activeFileId: newActiveId,
                originalFileContents: newOriginals
            };
        });
        toast.success(`Deleted ${fileToDelete.name}`);
      },
      setActiveFileId: (fileId: string | null) => {
        set({ activeFileId: fileId });
      },
      toggleFolder: (folderId: string) => {
        set(state => {
            const newSet = new Set(state.expandedFolders);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return { expandedFolders: Array.from(newSet) };
        });
      },
      searchFiles: (query: string): SearchResult[] => {
        if (!query) return [];
        const allFiles = flattenFiles(get().files);
        const results: SearchResult[] = [];

        allFiles.forEach(file => {
            if (file.isFolder) return;
            const matches: SearchMatch[] = [];
            const regex = new RegExp(query, 'gi');

            if (file.content) {
                const lines = file.content.split('\n');
                lines.forEach((line, index) => {
                    if (regex.test(line)) {
                        matches.push({
                            lineNumber: index + 1,
                            lineContent: line.trim(),
                        });
                    }
                });
            }
            if (matches.length > 0) {
                results.push({ file, matches });
            } else if (file.name.match(regex)) {
                results.push({ file, matches: [] }); // Filename match
            }
        });
        return results;
      },
      replaceInFiles: (query: string, replaceWith: string) => {
        const { files } = get();
        let filesUpdated = 0;
        let totalReplacements = 0;
        const searchRegex = new RegExp(query, 'gi');

        const updatedFiles = files.map(function replaceDeep(file): FileType {
            if (file.isFolder) {
                return {...file, children: file.children?.map(replaceDeep)};
            }
            
            const originalContent = file.content;
            const replacementCount = (originalContent.match(searchRegex) || []).length;

            if (replacementCount > 0) {
                const newContent = originalContent.replace(searchRegex, replaceWith);
                filesUpdated++;
                totalReplacements += replacementCount;
                return {...file, content: newContent, updatedAt: new Date()};
            }
            return file;
        });
        
        set({ files: updatedFiles });
        return { filesUpdated, replacements: totalReplacements };
      },
      reset: () => {
        set(initialState);
      },
      setWorkspace: (clonedFiles: { path: string, content: string }[]) => {
        const newFiles: FileType[] = [];
        const newOriginals: Record<string, string> = {};
        const newExpanded: string[] = [];
        const dirMap = new Map<string, FileType>();

        clonedFiles.forEach(cf => {
            const parts = cf.path.split('/');
            let currentParentId: string | null = null;
            let currentPath = '';

            parts.forEach((part, index) => {
                const isLastPart = index === parts.length - 1;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (isLastPart) { // It's a file
                    const newFile: FileType = {
                        _id: uuidv4(),
                        name: part,
                        content: cf.content,
                        isFolder: false,
                        parentId: currentParentId,
                        language: getLanguageConfigFromFilename(part).monacoLanguage,
                        isOpen: false,
                        isActive: false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    newOriginals[newFile._id] = cf.content;

                    if (currentParentId) {
                        const parent = dirMap.get(currentParentId);
                        parent?.children?.push(newFile);
                    } else {
                        newFiles.push(newFile);
                    }
                } else { // It's a directory
                    let dirNode = Array.from(dirMap.values()).find(d => d.name === part && d.parentId === currentParentId);
                    if (!dirNode) {
                        dirNode = {
                            _id: uuidv4(),
                            name: part,
                            content: '',
                            isFolder: true,
                            parentId: currentParentId,
                            language: 'plaintext',
                            isOpen: false,
                            isActive: false,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            children: []
                        };
                        dirMap.set(dirNode._id, dirNode);
                        newExpanded.push(dirNode._id);
                        if (currentParentId) {
                           const parent = dirMap.get(currentParentId);
                           parent?.children?.push(dirNode);
                        } else {
                           newFiles.push(dirNode);
                        }
                    }
                    currentParentId = dirNode._id;
                }
            });
        });

        // Open the README if it exists, otherwise the first file.
        const readme = flattenFiles(newFiles).find(f => f.name.toLowerCase() === 'readme.md');
        const firstFile = flattenFiles(newFiles).find(f => !f.isFolder);
        let activeId = null;
        if (readme) {
            readme.isOpen = true;
            readme.isActive = true;
            activeId = readme._id;
        } else if (firstFile) {
            firstFile.isOpen = true;
            firstFile.isActive = true;
            activeId = firstFile._id;
        }
        
        set({ 
            files: newFiles, 
            originalFileContents: newOriginals, 
            activeFileId: activeId, 
            expandedFolders: newExpanded 
        });
      },
      getDirtyFiles: () => {
        const { files, originalFileContents } = get();
        return flattenFiles(files).filter(file =>
            !file.isFolder &&
            originalFileContents.hasOwnProperty(file._id) &&
            file.content !== originalFileContents[file._id]
        );
      },
      commit: (message: string) => {
        const { files, originalFileContents } = get();
        const newOriginals = { ...originalFileContents };
        const dirtyFiles = flattenFiles(files).filter(f => !f.isFolder && f.content !== newOriginals[f._id]);
        
        dirtyFiles.forEach(file => {
            newOriginals[file._id] = file.content;
        });

        set({ originalFileContents: newOriginals });
      }
    }),
    {
      name: 'codeverse-filesystem-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.loading = false;
      },
    }
  )
);
