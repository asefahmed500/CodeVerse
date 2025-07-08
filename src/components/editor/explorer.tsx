"use client";

import { ChevronRight, ChevronDown, FolderPlus, FilePlus, RefreshCw, X, Pencil } from "lucide-react";
import React, { useState } from "react";
import { useFileSystem } from "@/hooks/use-file-system";
import { useRouter } from "next/navigation";
import type { FileType } from "@/types";
import { useActiveView } from "@/hooks/use-active-view";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { FileIcon } from "./file-icon";
import { Button } from "../ui/button";

export function Explorer() {
  const { activeView } = useActiveView();
  const { createFile, createFolder, refreshFiles, loading } = useFileSystem();

  if (activeView !== "explorer") {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground select-none">
      <div className="p-2 border-b border-border flex items-center justify-between group">
        <h3 className="font-bold text-sm uppercase">Explorer</h3>
        <div className="items-center hidden group-hover:flex">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createFile('Untitled')}>
            <FilePlus size={16}/>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createFolder('New Folder')}>
            <FolderPlus size={16}/>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshFiles}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </Button>
        </div>
      </div>
      <FileTree />
    </div>
  );
}

function FileTree() {
  const { files, updateFile, loading } = useFileSystem();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleRename = (file: FileType) => {
    if (!editingValue.trim() || editingValue === file.name) {
        setEditingId(null);
        return;
    }
    updateFile(file._id, { name: editingValue }).then(() => {
        toast.success(`Renamed to ${editingValue}`);
        setEditingId(null);
    }).catch(() => toast.error('Failed to rename'));
  };

  const renderFile = (file: FileType, depth: number) => (
    <FileTreeItem
      key={file._id}
      file={file}
      depth={depth}
      isExpanded={expandedFolders.has(file._id)}
      onToggleExpand={toggleFolder}
      onRename={handleRename}
      editingId={editingId}
      setEditingId={setEditingId}
      editingValue={editingValue}
      setEditingValue={setEditingValue}
    >
      {file.isFolder && expandedFolders.has(file._id) && file.children?.map(child => renderFile(child, depth + 1))}
    </FileTreeItem>
  );

  return (
    <div className="flex-1 overflow-y-auto p-1">
      <div 
        className="flex items-center p-1 cursor-pointer"
        onClick={() => setIsProjectExpanded(!isProjectExpanded)}
      >
          {isProjectExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          <span className="font-bold text-sm ml-1 uppercase">CodeVerse</span>
      </div>
      {isProjectExpanded && (
        loading ? <p className="p-2 text-xs">Loading...</p> : files.map(file => renderFile(file, 0))
      )}
    </div>
  );
}

function FileTreeItem({
  file,
  depth,
  isExpanded,
  onToggleExpand,
  children,
  onRename,
  editingId,
  setEditingId,
  editingValue,
  setEditingValue
}: {
  file: FileType;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  children: React.ReactNode;
  onRename: (file: FileType) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}) {
  const router = useRouter();
  const { setActiveFile, activeFile, deleteFile } = useFileSystem();

  const isEditing = editingId === file._id;

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 rounded hover:bg-accent cursor-pointer group ${activeFile?._id === file._id ? "bg-muted" : ""}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (file.isFolder) {
            onToggleExpand(file._id);
          } else {
            router.push(`/editor/${file._id}`);
          }
        }}
      >
        {file.isFolder ? (
          isExpanded ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />
        ) : <div className="w-4 mr-1" />}
        <FileIcon filename={file.name} isFolder={file.isFolder} isExpanded={isExpanded} className="mr-2" />
        {isEditing ? (
            <Input 
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => onRename(file)}
                onKeyDown={(e) => e.key === 'Enter' && onRename(file)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="h-6 text-sm bg-background border-primary"
            />
        ) : (
            <span className="truncate text-sm">{file.name}</span>
        )}
        <div className="flex-grow" />
        <div className="hidden group-hover:flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); setEditingId(file._id); setEditingValue(file.name);}}><Pencil size={14}/></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteFile(file._id); }}><X size={14}/></Button>
        </div>
      </div>
      {children}
    </div>
  );
}
