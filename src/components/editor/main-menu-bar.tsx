
"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useFileSystem } from "@/hooks/use-file-system";
import { useEditorStore } from "@/hooks/use-editor-store";
import { useCommandPaletteStore } from "@/hooks/use-command-palette-store";
import { useActiveView } from "@/hooks/use-active-view";
import { useCodeRunner } from "@/hooks/use-code-runner";
import { useRouter } from "next/navigation";

export function MainMenuBar() {
  const { createFile, createFolder, activeFileId, findFile } = useFileSystem();
  const { editor, triggerSave, triggerCommand } = useEditorStore();
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteStore();
  const { setActiveView, openView } = useActiveView();
  const { runActiveFile } = useCodeRunner();
  const router = useRouter();

  const activeFile = findFile(activeFileId || '');

  const handleNewFile = async () => {
    const newFile = await createFile('Untitled.js');
    if (newFile) {
        router.push(`/editor/${newFile._id}`);
    }
  }

  const isRunnable = activeFile && !activeFile.isFolder;

  return (
    <Menubar className="rounded-none border-none p-0 h-8 bg-transparent">
      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={handleNewFile}>New File</MenubarItem>
          <MenubarItem onSelect={() => createFolder('New Folder')}>New Folder</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={triggerSave} disabled={!activeFile || activeFile.isFolder}>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={() => window.close()}>Exit</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">Edit</MenubarTrigger>
        <MenubarContent>
            <MenubarItem onSelect={() => triggerCommand('editor.action.undo')} disabled={!editor}>
                Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => triggerCommand('editor.action.redo')} disabled={!editor}>
                Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => triggerCommand('editor.action.clipboardCutAction')} disabled={!editor}>
                Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => triggerCommand('editor.action.clipboardCopyAction')} disabled={!editor}>
                Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => triggerCommand('editor.action.clipboardPasteAction')} disabled={!editor}>
                Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => triggerCommand('editor.action.commentLine')} disabled={!editor}>
                Toggle Line Comment <MenubarShortcut>Ctrl+/</MenubarShortcut>
            </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => setCommandPaletteOpen(true)}>
            Command Palette <MenubarShortcut>Ctrl+P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={() => setActiveView('explorer')}>Explorer</MenubarItem>
          <MenubarItem onSelect={() => setActiveView('search')}>Search</MenubarItem>
          <MenubarItem onSelect={() => setActiveView('github')}>Source Control</MenubarItem>
          <MenubarItem onSelect={() => openView('terminal')}>Terminal</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">Go</MenubarTrigger>
        <MenubarContent>
            <MenubarItem onSelect={() => setCommandPaletteOpen(true)}>Go to File...</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">Run</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={runActiveFile} disabled={!isRunnable}>
            Run File
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-full px-2">Terminal</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => openView('terminal')}>New Terminal</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
