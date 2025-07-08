"use client";

import { create } from "zustand";

export type ActiveView = "explorer" | "search" | "github" | "terminal" | "settings" | null;

interface ActiveViewState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  openView: (view: ActiveView) => void;
}

export const useActiveView = create<ActiveViewState>((set) => ({
  activeView: "explorer",
  setActiveView: (view) => set(state => ({ activeView: state.activeView === view ? null : view })),
  openView: (view) => set({ activeView: view }),
}));
