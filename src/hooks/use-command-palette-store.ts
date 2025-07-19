import { create } from 'zustand';

interface CommandPaletteState {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
    toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
