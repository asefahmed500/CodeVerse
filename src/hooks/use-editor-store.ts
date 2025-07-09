import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import type * as monaco from 'monaco-editor';

// A function that can save content. It's passed from CodeEditor.
type SaveFunction = () => void;

interface EditorState {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  setEditor: (editor: monaco.editor.IStandaloneCodeEditor | null) => void;
  saveHandler: SaveFunction | null;
  setSaveHandler: (handler: SaveFunction | null) => void;
  triggerSave: () => void;
  triggerCommand: (commandId: string) => void;
  cursorPosition: monaco.Position | null;
  setCursorPosition: (position: monaco.Position | null) => void;
  breakpoints: Record<string, number[]>; // fileId -> line numbers
  toggleBreakpoint: (fileId: string, lineNumber: number) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
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
        editor?.getAction(commandId)?.run();
      },
      cursorPosition: null,
      setCursorPosition: (position) => set({ cursorPosition: position }),
      breakpoints: {},
      toggleBreakpoint: (fileId: string, lineNumber: number) => {
        set(state => {
          const fileBreakpoints = state.breakpoints[fileId] || [];
          const newBreakpoints = fileBreakpoints.includes(lineNumber)
            ? fileBreakpoints.filter(ln => ln !== lineNumber)
            : [...fileBreakpoints, lineNumber];
          return {
            breakpoints: {
              ...state.breakpoints,
              [fileId]: newBreakpoints
            }
          };
        });
      },
    }),
    {
      name: 'editor-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist breakpoints, not the live editor instance
      partialize: (state) => ({ breakpoints: state.breakpoints }),
    }
  )
);
