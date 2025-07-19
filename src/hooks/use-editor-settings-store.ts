import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EDITOR_CONFIG } from '@/config/editor';

interface EditorSettings {
  fontSize: number;
  tabSize: number;
}

interface EditorSettingsState extends EditorSettings {
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  resetSettings: () => void;
}

const defaultSettings: EditorSettings = {
  fontSize: EDITOR_CONFIG.fontSize,
  tabSize: EDITOR_CONFIG.tabSize,
};

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'editor-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
