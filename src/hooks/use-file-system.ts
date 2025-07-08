"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FileType } from "@/types";

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
      return { ...file, ...updates };
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

interface FileSystemContextType {
  files: FileType[];
  activeFile: FileType | null;
  setActiveFile: (file: FileType | null) => void;
  loading: boolean;
  createFile: (name: string, parentId?: string) => Promise<FileType | null>;
  createFolder: (name: string, parentId?: string) => Promise<FileType | null>;
  updateFile: (fileId: string, updates: Partial<FileType>) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  refreshFiles: () => void;
  getPathForFile: (fileId: string) => string;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileType[]>([]);
  const [activeFile, setActiveFile] = useState<FileType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/files");
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      toast.error("Failed to load file system.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  const getPathForFile = useCallback((fileId: string): string => {
    const allFiles: FileType[] = [];
    const flatten = (fs: FileType[]) => {
        fs.forEach(item => {
            allFiles.push(item);
            if(item.isFolder && item.children) flatten(item.children);
        })
    }
    flatten(files);

    const fileMap = new Map(allFiles.map(f => [f._id.toString(), f]));
    
    const buildPath = (fId: string): string => {
        const file = fileMap.get(fId);
        if (!file) return '';
        if (!file.parentId) return `/${file.name}`;
        const parentPath = buildPath(file.parentId.toString());
        return parentPath === '/' ? `${parentPath}${file.name}` : `${parentPath}/${file.name}`;
    };

    return buildPath(fileId);
  }, [files]);

  const getUniqueName = useCallback((baseName: string, parentId: string | undefined | null): string => {
    const existingNames = new Set<string>();

    function findNames(items: FileType[], targetParentId: string | null) {
      if (targetParentId === null) {
        items.forEach(item => {
          if (item.parentId === null) existingNames.add(item.name);
        });
        return;
      }

      for (const item of items) {
        if (item._id === targetParentId && item.isFolder) {
          (item.children || []).forEach(child => existingNames.add(child.name));
          return;
        }
        if (item.isFolder && item.children) {
          findNames(item.children, targetParentId);
        }
      }
    }
    findNames(files, parentId || null);

    let newName = baseName;
    let counter = 1;
    const nameParts = baseName.split('.');
    const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
    const nameWithoutExt = nameParts.join('.');

    while (existingNames.has(newName)) {
      newName = `${nameWithoutExt}-${counter}${ext || ''}`;
      counter++;
    }
    return newName;
  }, [files]);

  const createFile = async (name: string, parentId?: string): Promise<FileType | null> => {
    const uniqueName = getUniqueName(name, parentId);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: uniqueName, isFolder: false, parentId, isActive: true, isOpen: true }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to create file");
        return null;
      }

      const newFile = await res.json();
      setFiles(prev => {
        const deactivated = deactivateAllFiles(prev);
        return addFileToTree(deactivated, newFile)
      });
      setActiveFile(newFile);
      router.push(`/editor/${newFile._id}`);
      return newFile;
    } catch (e) {
      toast.error("An unexpected error occurred.");
      return null;
    }
  };

  const createFolder = async (name: string, parentId?: string): Promise<FileType | null> => {
    const uniqueName = getUniqueName(name, parentId);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: uniqueName, isFolder: true, parentId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to create folder");
        return null;
      }
      const newFolder = await res.json();
      setFiles(prev => addFileToTree(prev, newFolder));
      return newFolder;
    } catch (e) {
      toast.error("An unexpected error occurred.");
      return null;
    }
  };

  const updateFile = async (fileId: string, updates: Partial<FileType>) => {
    const previousFiles = files;
    
    // Optimistic UI update
    setFiles(prev => {
        let tree = prev;
        if (updates.isActive) {
            tree = deactivateAllFiles(tree);
        }
        const updatedTree = updateFileInTree(tree, fileId, updates);
        
        if (updates.isActive) {
          const updatedFile = findNodeInTree(updatedTree, fileId);
          setActiveFile(updatedFile);
        }

        return updatedTree;
    });
    
    try {
        const res = await fetch("/api/files", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId, ...updates }),
        });
        if (!res.ok) throw new Error("Failed to update file on server");
        
        const finalUpdatedFile = await res.json();
        // Sync with server state
        setFiles(prev => updateFileInTree(prev, fileId, finalUpdatedFile));
        if (updates.isActive) {
            setActiveFile(finalUpdatedFile);
        }

    } catch (error) {
        toast.error(`Failed to update file.`);
        setFiles(previousFiles); // Rollback on error
    }
  };

  const deleteFile = async (fileId: string) => {
    const previousFiles = files;
    const fileToDelete = findNodeInTree(files, fileId);

    if (!fileToDelete) return;

    // Optimistic update
    setFiles(prev => deleteFileFromTree(prev, fileId));
    
    try {
        const res = await fetch("/api/files", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId }),
        });
        
        if (!res.ok) throw new Error("Failed to delete file on server.");

        const { success, newActiveFileId } = await res.json();
        if (success) {
            if (activeFile?._id === fileId) {
                if (newActiveFileId) {
                    router.push(`/editor/${newActiveFileId}`);
                } else {
                    setActiveFile(null);
                    router.push('/editor');
                }
            }
        } else {
          throw new Error("Server failed to delete file.");
        }
    } catch(error) {
        toast.error(`Failed to delete ${fileToDelete.name}.`);
        setFiles(previousFiles);
    }
  };

  const value = {
    files,
    activeFile,
    setActiveFile,
    loading,
    createFile,
    createFolder,
    updateFile,
    deleteFile,
    refreshFiles: fetchFiles,
    getPathForFile,
  };

  return React.createElement(FileSystemContext.Provider, { value }, children);
}

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
};
