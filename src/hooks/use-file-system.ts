"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FileType } from "@/types";

// --- Helper Functions ---
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

  const createFile = async (name: string, parentId?: string) => {
    try {
        const res = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, isFolder: false, parentId, isActive: true, isOpen: true }),
        });
        
        if (!res.ok) {
            if (res.status === 409) {
                const { error } = await res.json();
                toast.error(error);
            } else {
                toast.error("Failed to create file");
            }
            return null;
        }

        const newFile = await res.json();
        
        setFiles(prev => {
            const deactivated = deactivateAllFiles(prev);
            return addFileToTree(deactivated, newFile)
        });
        setActiveFile(newFile);
        return newFile;
    } catch (e) {
        toast.error("An unexpected error occurred.");
        return null;
    }
  };

  const createFolder = async (name: string, parentId?: string) => {
    try {
        const res = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, isFolder: true, parentId }),
          });
          if (!res.ok) {
            if (res.status === 409) {
                const { error } = await res.json();
                toast.error(error);
            } else {
                toast.error("Failed to create folder");
            }
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
    const res = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, ...updates }),
      });
    if (!res.ok) throw new Error("Failed to update file");
    const updatedFile = await res.json();

    setFiles(prev => {
        let tree = prev;
        if (updates.isActive) {
            tree = deactivateAllFiles(tree);
        }
        return updateFileInTree(tree, fileId, updatedFile);
    });

    if (updates.isActive) {
        setActiveFile(updatedFile);
    }
    if (updates.isOpen === false && activeFile?._id === fileId) {
      // Logic to switch active file is handled in component
    }
  };

  const deleteFile = async (fileId: string) => {
    const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
    });
    const { success, newActiveFileId } = await res.json();

    if (success) {
        setFiles(prev => deleteFileFromTree(prev, fileId));
        if (activeFile?._id === fileId) {
            if (newActiveFileId) {
                router.push(`/editor/${newActiveFileId}`);
            } else {
                setActiveFile(null);
                router.push('/editor');
            }
        }
    } else {
        toast.error("Failed to delete file.");
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
  };

  return React.createElement(FileSystemContext.Provider, { value: value }, children);
}

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
};
