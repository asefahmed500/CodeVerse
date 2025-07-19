
"use client";

import { create } from "zustand";

export type ActiveView = "explorer" | "search" | "github" | "terminal" | "settings" | "debug" | "problems" | null;

interface ActiveViewState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  toggleActiveView: (view: ActiveView) => void;
  openView: (view: ActiveView) => void;
}

export const useActiveView = create<ActiveViewState>((set) => ({
  activeView: "explorer",
  // A simple setter for the view.
  setActiveView: (view) => set({ activeView: view }),
  // A function to toggle a view on or off. If the view is part of the bottom panel, it will toggle between that view and the main 'explorer' view.
  toggleActiveView: (view) => set(state => ({
    activeView: state.activeView === view ? 'explorer' : view
  })),
  // An alias for setActiveView, used when the intent is to explicitly open a view.
  openView: (view) => set({ activeView: view }),
}));
