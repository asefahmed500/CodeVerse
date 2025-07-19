
"use client";

import { ChevronRight, FolderPlus, FilePlus, Copy, X, Pencil, Folder, Search } from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

function CreationInput({
  type,
  parentId,
  depth,
  onComplete,
}: {
  type: 'file' | 'folder';
  parentId: string | null;
  depth: number;
  onComplete: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    onComplete(name.trim());
  };

  return (
    <div
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className="flex items-center py-1 px-2"
    >
      <div className="flex items-center w-full">
        {type === 'folder' ? (
            <ChevronRight size={16} className="mr-1 invisible" />
          ) : <div className="w-4 mr-1" />
        }
        {type === 'file' ? (
          <FileIcon filename={name} className="mr-2" />
        ) : (
          <Folder size={16} className="mr-2" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleCreate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') onComplete('');
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-6 text-sm bg-background border-primary"
        />
      </div>
    </div>
  );
}

export function Explorer() {
  const { activeView } = useActiveView();
  const [creating, setCreating] = useState<{ type: 'file' | 'folder'; parentId: string | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toggleFolder, expandedFolders, createFile, createFolder } = useFileSystem();
  const router = useRouter();

  if (activeView !== "explorer") {
    return null;
  }
  
  const handleStartCreation = (type: 'file' | 'folder', parentId: string | null) => {
    if (parentId && !expandedFolders.includes(parentId)) {
      toggleFolder(parentId);
    }
    setCreating({ type, parentId });
  };

  const handleCreationComplete = async (name: string, type: 'file' | 'folder', parentId: string | null) => {
    setCreating(null);
    if (!name) return;

    if (type === 'file') {
      const newFile = await createFile(name, parentId);
      if (newFile) {
        router.push(`/editor/${newFile._id}`);
      }
    } else if (type === 'folder') {
      await createFolder(name, parentId);
    }
  };


  return (
    <div className="h-full flex flex-col bg-card text-card-foreground select-none">
        <div className="p-2 border-b border-border flex items-center justify-between group">
          <h3 className="font-bold text-xs uppercase tracking-wider">Explorer</h3>
          <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartCreation('file', null)}>
              <FilePlus size={16}/>
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartCreation('folder', null)}>
              <FolderPlus size={16}/>
              </Button>
          </div>
        </div>
        <div className="p-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search files..."
                    className="h-8 pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <FileTree
          creating={creating}
          onStartCreation={handleStartCreation}
          onCreationComplete={handleCreationComplete}
          searchTerm={searchTerm}
        />
    </div>
  );
}

function FileTree({ 
    creating, 
    onStartCreation, 
    onCreationComplete,
    searchTerm,
}: {
  creating: { type: 'file' | 'folder'; parentId: string | null } | null;
  onStartCreation: (type: 'file' | 'folder', parentId: string | null) => void;
  onCreationComplete: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
  searchTerm: string;
}) {
  const { files, loading, expandedFolders } = useFileSystem();

  const filteredFiles = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) return files;
    
    const allFiles = useFileSystem.getState().allFiles;
    const fileMap = new Map(allFiles.map(f => [f._id, f]));
    const matchingIds = new Set<string>();

    for (const file of allFiles) {
      if (file.name.toLowerCase().includes(lowerCaseSearch)) {
        matchingIds.add(file._id);
        let currentParentId = file.parentId;
        while(currentParentId) {
            matchingIds.add(currentParentId);
            const parent = fileMap.get(currentParentId);
            currentParentId = parent?.parentId ?? null;
        }
      }
    }

    const filterRec = (nodes: FileType[]): FileType[] => {
      const results: FileType[] = [];
      for (const node of nodes) {
        if (matchingIds.has(node._id)) {
          const newNode = { ...node };
          if (node.isFolder && node.children) {
            newNode.children = filterRec(node.children);
          }
          results.push(newNode);
        }
      }
      return results;
    }

    return filterRec(files);
  }, [files, searchTerm]);
  
  const renderFile = (file: FileType, depth: number) => (
    <React.Fragment key={file._id}>
      <FileTreeItem
        file={file}
        depth={depth}
        onStartCreation={onStartCreation}
      />
      {file.isFolder && (expandedFolders.includes(file._id) || searchTerm) && (
        <>
          {file.children?.map(child => renderFile(child, depth + 1))}
          {creating && creating.parentId === file._id && (
            <CreationInput
              type={creating.type}
              parentId={file._id}
              depth={depth + 1}
              onComplete={(name) => onCreationComplete(name, creating.type, file._id)}
            />
          )}
        </>
      )}
    </React.Fragment>
  );

  return (
    <ScrollArea className="flex-1 px-2">
      {loading ? <p className="p-2 text-xs">Loading...</p> : filteredFiles.map(file => renderFile(file, 0))}
      {creating && creating.parentId === null && (
        <CreationInput
          type={creating.type}
          parentId={null}
          depth={0}
          onComplete={(name) => onCreationComplete(name, creating.type, null)}
        />
      )}
    </ScrollArea>
  );
}

function FileTreeItem({
  file,
  depth,
  onStartCreation,
}: {
  file: FileType;
  depth: number;
  onStartCreation: (type: 'file' | 'folder', parentId: string | null) => void;
}) {
  const router = useRouter();
  const { activeFileId, setActiveFileId, toggleFolder, expandedFolders, deleteFile, updateFile, duplicateFileOrFolder } = useFileSystem();
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(file.name);
  
  const isExpanded = expandedFolders.includes(file._id);

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.isFolder) {
      toggleFolder(file._id);
    } else {
      setActiveFileId(file._id);
      router.push(`/editor/${file._id}`);
    }
  };
  
  const handleContextMenuTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFileId(file._id);
  }

  const handleRename = async () => {
    if (!editingValue.trim()) {
        setIsEditing(false);
        setEditingValue(file.name);
        return;
    }
    if (editingValue.trim() === file.name) {
        setIsEditing(false);
        return;
    }
    await updateFile(file._id, { name: editingValue.trim() });
    setIsEditing(false);
  };
  
  const handleCancelRename = () => {
    setIsEditing(false);
    setEditingValue(file.name);
  }

  const handleDuplicate = async () => {
    await duplicateFileOrFolder(file._id);
  }
  
  const handleNewFile = (e: Event) => {
    e.stopPropagation();
    if (file.isFolder) {
      onStartCreation('file', file._id);
    }
  }
  
  const handleNewFolder = (e: Event) => {
    e.stopPropagation();
    if (file.isFolder) {
      onStartCreation('folder', file._id);
    }
  }

  const handleDelete = async () => {
    const wasActive = activeFileId === file._id;
    const { nextActiveFileId } = await deleteFile(file._id);
    
    if (wasActive) {
      if (nextActiveFileId) {
        router.replace(`/editor/${nextActiveFileId}`);
      } else {
        router.replace('/editor');
      }
    }
  };

  const handleRenameClick = () => {
    setIsEditing(true);
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
            className={cn(`flex items-center py-1 px-2 rounded cursor-pointer group`, activeFileId === file._id && "bg-accent text-accent-foreground")}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleItemClick}
            onContextMenu={handleContextMenuTrigger}
          >
            {file.isFolder ? (
              <ChevronRight size={16} className={`mr-1 transition-transform transform ${isExpanded ? 'rotate-90' : ''}`} />
            ) : <div className="w-4 mr-1" />}
            
            {isEditing ? (
              <div className="flex items-center w-full">
                <FileIcon filename={editingValue} isFolder={file.isFolder} isExpanded={isExpanded} className="mr-2" />
                <Input 
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="h-6 text-sm bg-background border-primary"
                />
              </div>
            ) : (
              <>
                <FileIcon filename={file.name} isFolder={file.isFolder} isExpanded={isExpanded} className="mr-2" />
                <span className="truncate text-sm">{file.name}</span>
              </>
            )}
          </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start" onContextMenu={(e) => e.preventDefault()}>
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
          <DropdownMenuItem onSelect={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onSelect={handleDelete}>
            <X className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
