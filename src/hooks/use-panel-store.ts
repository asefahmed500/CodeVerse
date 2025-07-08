"use client";

import { create } from "zustand";

interface PanelState {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (isCollapsed: boolean) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  isCollapsed: true,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
}));
