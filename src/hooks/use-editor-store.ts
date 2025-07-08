import { create } from "zustand";
import type * as monaco from 'monaco-editor';

// A function that can save content. It's passed from CodeEditor.
type SaveFunction = () => Promise<void>;

interface EditorState {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  setEditor: (editor: monaco.editor.IStandaloneCodeEditor | null) => void;
  saveHandler: SaveFunction | null;
  setSaveHandler: (handler: SaveFunction | null) => void;
  triggerSave: () => void;
  triggerCommand: (commandId: string) => void;
  cursorPosition: monaco.Position | null;
  setCursorPosition: (position: monaco.Position | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  saveHandler: null,
  setSaveHandler: (handler) => set({ saveHandler: handler }),
  triggerSave: () => {
    const { saveHandler } = get();
    if (saveHandler) {
      saveHandler();
    }
  },
  triggerCommand: (commandId: string) => {
    const { editor } = get();
    // Trigger a command on the Monaco editor instance
    editor?.getAction(commandId)?.run();
  },
  cursorPosition: null,
  setCursorPosition: (position) => set({ cursorPosition: position }),
}));
