"use client";

import { create } from "zustand";

// THIS HOOK IS DEPRECATED AND SHOULD NOT BE USED.
// The panel's visibility is now derived directly from the `useActiveView` hook
// to prevent state synchronization issues and infinite render loops.

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
