"use client";

import { ChevronRight, FolderPlus, FilePlus, Copy, X, Pencil, Folder } from "lucide-react";
import React, { useState, useEffect } from "react";
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
import { getLanguageConfigFromFilename } from "@/config/languages";

function CreationInput({
  type,
  parentId,
  depth,
  onComplete,
}: {
  type: 'file' | 'folder';
  parentId: string | null;
  depth: number;
  onComplete: () => void;
}) {
  const { createFile, createFolder } = useFileSystem();
  const [name, setName] = useState('');
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      onComplete();
      return;
    }

    if (type === 'file') {
      const newFile = await createFile(name, parentId);
      if (newFile) {
        router.push(`/editor/${newFile._id}`);
      }
    } else {
      await createFolder(name, parentId);
    }
    onComplete();
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
            if (e.key === 'Escape') onComplete();
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
  const { toggleFolder, expandedFolders } = useFileSystem();

  if (activeView !== "explorer") {
    return null;
  }
  
  const handleStartCreation = (type: 'file' | 'folder', parentId: string | null) => {
    if (parentId && !expandedFolders.includes(parentId)) {
      toggleFolder(parentId);
    }
    setCreating({ type, parentId });
  };

  const handleCreationComplete = () => {
    setCreating(null);
  };

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground select-none">
        <div className="p-2 border-b border-border flex items-center justify-between group">
        <h3 className="font-bold text-sm uppercase">Explorer</h3>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartCreation('file', null)}>
            <FilePlus size={16}/>
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartCreation('folder', null)}>
            <FolderPlus size={16}/>
            </Button>
        </div>
        </div>
        <FileTree
          creating={creating}
          onStartCreation={handleStartCreation}
          onCreationComplete={handleCreationComplete}
        />
    </div>
  );
}

function FileTree({ creating, onStartCreation, onCreationComplete }: {
  creating: { type: 'file' | 'folder'; parentId: string | null } | null;
  onStartCreation: (type: 'file' | 'folder', parentId: string | null) => void;
  onCreationComplete: () => void;
}) {
  const { files, loading, expandedFolders } = useFileSystem();

  const renderFile = (file: FileType, depth: number) => (
    <React.Fragment key={file._id}>
      <FileTreeItem
        file={file}
        depth={depth}
        onStartCreation={onStartCreation}
      />
      {file.isFolder && expandedFolders.includes(file._id) && (
        <>
          {file.children?.map(child => renderFile(child, depth + 1))}
          {creating && creating.parentId === file._id && (
            <CreationInput
              type={creating.type}
              parentId={file._id}
              depth={depth + 1}
              onComplete={onCreationComplete}
            />
          )}
        </>
      )}
    </React.Fragment>
  );

  return (
    <div className="flex-1 overflow-y-auto p-1">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center p-1 font-bold text-sm uppercase w-full">
            <ChevronRight size={16} className="transform transition-transform duration-200 data-[state=open]:rotate-90"/>
            <span className="ml-1">CODEVERSE WORKSPACE</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
            {loading ? <p className="p-2 text-xs">Loading...</p> : files.map(file => renderFile(file, 0))}
            {creating && creating.parentId === null && (
              <CreationInput
                type={creating.type}
                parentId={null}
                depth={0}
                onComplete={onCreationComplete}
              />
            )}
        </CollapsibleContent>
      </Collapsible>
    </div>
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
        setEditingValue(file.name);
        return;
    }
    await updateFile(file._id, { name: editingValue });
    toast.success(`Renamed to ${editingValue}`);
    setIsEditing(false);
  };
  
  const handleCancelRename = () => {
    setIsEditing(false);
    setEditingValue(file.name);
  }

  const handleDuplicate = async (e: Event) => {
    e.preventDefault();
    await duplicateFileOrFolder(file._id);
  }
  
  const handleNewFile = (e: Event) => {
    e.preventDefault();
    onStartCreation('file', file._id);
  }
  
  const handleNewFolder = (e: Event) => {
    e.preventDefault();
    onStartCreation('folder', file._id);
  }

  const handleDelete = async (e: Event) => {
    e.preventDefault();
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
          <DropdownMenuItem onSelect={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onSelect={handleDelete}>
            <X className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
