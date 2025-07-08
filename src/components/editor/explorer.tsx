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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="flex items-center">
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
  const { files, updateFile, loading, expandedFolders, toggleFolder } = useFileSystem();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleRename = async (file: FileType) => {
    if (!editingValue.trim() || editingValue === file.name) {
        setEditingId(null);
        return;
    }
    try {
      await updateFile(file._id, { name: editingValue });
      toast.success(`Renamed to ${editingValue}`);
    } finally {
      setEditingId(null);
    }
  };

  const renderFile = (file: FileType, depth: number) => (
    <FileTreeItem
      key={file._id}
      file={file}
      depth={depth}
      isExpanded={expandedFolders.has(file._id)}
      onToggleExpand={() => toggleFolder(file._id)}
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
      <div className="flex items-center p-1 font-bold text-sm uppercase">
          <ChevronDown size={16}/>
          <span className="ml-1">CodeVerse</span>
      </div>
      {loading ? <p className="p-2 text-xs">Loading...</p> : files.map(file => renderFile(file, 0))}
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
  onRename: (file: FileType) => Promise<void>;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}) {
  const router = useRouter();
  const { setActiveFile, activeFile, deleteFile, createFile, createFolder } = useFileSystem();

  const isEditing = editingId === file._id;

  const handleItemClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    e.stopPropagation();
    
    if (file.isFolder) {
      onToggleExpand(file._id);
      setActiveFile(file);
    } else {
      router.push(`/editor/${file._id}`);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFile(file);
    // The DropdownMenuTrigger will handle opening the menu.
    // We manually trigger a click to open it, as an alternative to managing open state.
    const trigger = e.currentTarget.querySelector('[data-context-menu-trigger="true"]');
    if (trigger instanceof HTMLElement) {
        trigger.click();
    }
  }
  
  return (
    <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <div data-context-menu-trigger="true" className="w-full"></div>
      </DropdownMenuTrigger>
      <div
          className={`flex items-center py-1 px-2 rounded hover:bg-accent cursor-pointer group ${activeFile?._id === file._id ? "bg-muted" : ""}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={handleItemClick}
          onContextMenu={handleContextMenu}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onRename(file);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="h-6 text-sm bg-background border-primary"
              />
          ) : (
              <span className="truncate text-sm">{file.name}</span>
          )}
        </div>
      <DropdownMenuContent className="w-48" align="start">
          {file.isFolder && (
            <>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); createFile('Untitled', file._id)}}>
                <FilePlus className="mr-2 h-4 w-4" />
                <span>New File</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); createFolder('New Folder', file._id)}}>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>New Folder</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingId(file._id); setEditingValue(file.name); }}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onSelect={(e) => { e.preventDefault(); deleteFile(file._id)}}>
            <X className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {children}
    </div>
  );
}
