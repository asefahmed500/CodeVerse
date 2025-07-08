
"use client";

import { ChevronRight, FolderPlus, FilePlus, RefreshCw, X, Pencil } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

export function Explorer() {
  const { activeView } = useActiveView();
  const { createFile, createFolder } = useFileSystem();
  const router = useRouter();

  if (activeView !== "explorer") {
    return null;
  }
  
  const handleNewFile = async () => {
    const newFile = await createFile('Untitled.js');
    if (newFile) router.push(`/editor/${newFile._id}`);
  };

  const handleNewFolder = () => {
    createFolder('New Folder');
  };

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground select-none">
        <div className="p-2 border-b border-border flex items-center justify-between group">
        <h3 className="font-bold text-sm uppercase">Explorer</h3>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewFile}>
            <FilePlus size={16}/>
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewFolder}>
            <FolderPlus size={16}/>
            </Button>
        </div>
        </div>
        <FileTree />
    </div>
  );
}

function FileTree() {
  const { files, loading, expandedFolders, toggleFolder } = useFileSystem();

  const renderFile = (file: FileType, depth: number) => (
    <FileTreeItem
      key={file._id}
      file={file}
      depth={depth}
    >
      {file.isFolder && expandedFolders.includes(file._id) && file.children?.map(child => renderFile(child, depth + 1))}
    </FileTreeItem>
  );

  return (
    <div className="flex-1 overflow-y-auto p-1">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center p-1 font-bold text-sm uppercase w-full">
            <ChevronRight size={16} className="transform transition-transform duration-200 data-[state=open]:rotate-90"/>
            <span className="ml-1">AETHERMIND WORKSPACE</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
            {loading ? <p className="p-2 text-xs">Loading...</p> : files.map(file => renderFile(file, 0))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function FileTreeItem({
  file,
  depth,
  children,
}: {
  file: FileType;
  depth: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { activeFileId, setActiveFileId, toggleFolder, expandedFolders, deleteFile, updateFile, createFile, createFolder } = useFileSystem();
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(file.name);

  const isExpanded = expandedFolders.includes(file._id);

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.isFolder) {
      toggleFolder(file._id);
    }
    setActiveFileId(file._id);
    if (!file.isFolder) {
        router.push(`/editor/${file._id}`);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFileId(file._id);
    const trigger = e.currentTarget.querySelector('[data-context-menu-trigger="true"]');
    if (trigger instanceof HTMLElement) trigger.click();
  }

  const handleRename = async () => {
    if (!editingValue.trim() || editingValue === file.name) {
        setIsEditing(false);
        return;
    }
    await updateFile(file._id, { name: editingValue });
    toast.success(`Renamed to ${editingValue}`);
    setIsEditing(false);
  };
  
  const handleNewFile = async (e: Event) => {
    e.preventDefault();
    const newFile = await createFile('Untitled.js', file._id);
    if(newFile) router.push(`/editor/${newFile._id}`);
  }
  
  const handleNewFolder = async (e: Event) => {
    e.preventDefault();
    await createFolder('New Folder', file._id);
  }

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    const wasActive = activeFileId === file._id;

    await deleteFile(file._id);
    
    if (wasActive) {
      const { allFiles } = useFileSystem.getState();
      const openFiles = allFiles.filter(f => !f.isFolder && f.isOpen);
      
      if (openFiles.length > 0) {
        openFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        router.replace(`/editor/${openFiles[0]._id}`);
      } else {
        router.replace('/editor');
      }
    }
  };

  const handleRenameClick = (e: Event) => {
    e.preventDefault();
    setIsEditing(true);
  }
  
  return (
    <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <div data-context-menu-trigger="true" className="w-full"></div>
      </DropdownMenuTrigger>
      <div
          className={`flex items-center py-1 px-2 rounded hover:bg-accent cursor-pointer group ${activeFileId === file._id ? "bg-muted" : ""}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={handleItemClick}
          onContextMenu={handleContextMenu}
        >
          {file.isFolder ? (
            <ChevronRight size={16} className={`mr-1 transition-transform transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : <div className="w-4 mr-1" />}
          <FileIcon filename={file.name} isFolder={file.isFolder} isExpanded={isExpanded} className="mr-2" />
          {isEditing ? (
              <Input 
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsEditing(false);
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
              <DropdownMenuItem onSelect={handleNewFile}>
                <FilePlus className="mr-2 h-4 w-4" />
                <span>New File</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleNewFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>New Folder</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={handleRenameClick}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onSelect={handleDelete}>
            <X className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {children}
    </div>
  );
}
