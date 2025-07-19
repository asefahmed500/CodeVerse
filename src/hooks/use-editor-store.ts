import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import type * as monaco from 'monaco-editor';

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
  reset: () => void;
}

const initialState = {
  editor: null,
  saveHandler: null,
  cursorPosition: null,
  breakpoints: {},
};


export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setEditor: (editor) => set({ editor }),
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
      setCursorPosition: (position) => set({ cursorPosition: position }),
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
      reset: () => set(initialState),
    }),
    {
      name: 'editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ breakpoints: state.breakpoints }),
    }
  )
);
