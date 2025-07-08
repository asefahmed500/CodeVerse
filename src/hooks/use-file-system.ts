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

const findNodeByPath = (files: FileType[], path: string): FileType | null => {
  const parts = path.split('/').filter(p => p);
  let currentNode: FileType | null = null;
  let currentChildren = files;

  for (const part of parts) {
    if (!currentChildren) return null;
    const found = currentChildren.find(f => f.name === part);
    if (found) {
      currentNode = found;
      currentChildren = found.children || [];
    } else {
      return null;
    }
  }
  return currentNode;
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
  activeFileId: string | null;
  expandedFolders: string[];
  loading: boolean;
  findFile: (fileId: string) => FileType | null;
  findFileByPath: (path: string) => FileType | null;
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
}

const initialFiles: FileType[] = [
    {
        _id: 'welcome-file',
        name: 'Welcome.md',
        content: '# Welcome to CodeVerse!\n\nThis is a client-side IDE. All your files are saved in your browser\'s local storage.\n\nTo get started, create a new file or folder using the icons in the explorer.\n\nHappy coding!',
        isFolder: false,
        parentId: null,
        language: 'markdown',
        isOpen: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: []
    }
];

export const useFileSystem = create<FileSystemState>()(
  persist(
    (set, get) => ({
      files: initialFiles,
      activeFileId: 'welcome-file',
      expandedFolders: [],
      loading: true, // Set to true initially, then false after mount
      findFile: (fileId: string) => {
        if (!fileId) return null;
        return findNodeInTree(get().files, fileId);
      },
      findFileByPath: (path: string) => {
        return findNodeByPath(get().files, path);
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

        set(state => ({
            files: deleteFileFromTree(state.files, fileId),
            activeFileId: newActiveId
        }));
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
        set({
            files: initialFiles,
            activeFileId: 'welcome-file',
            expandedFolders: [],
        });
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
