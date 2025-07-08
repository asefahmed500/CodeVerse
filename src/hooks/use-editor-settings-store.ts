import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EDITOR_CONFIG } from '@/config/editor';

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  vimMode: boolean;
}

interface EditorSettingsState extends EditorSettings {
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (value: EditorSettings['wordWrap']) => void;
  setMinimap: (enabled: boolean) => void;
  setVimMode: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: EditorSettings = {
  fontSize: EDITOR_CONFIG.fontSize,
  tabSize: EDITOR_CONFIG.tabSize,
  wordWrap: EDITOR_CONFIG.wordWrap,
  minimap: EDITOR_CONFIG.minimap.enabled,
  vimMode: false,
};

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setVimMode: (vimMode) => set({ vimMode }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'editor-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
