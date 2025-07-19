
"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from 'uuid';

interface TerminalState {
  outputToAppend: { id: string; content: string } | null;
  appendOutput: (content: string) => void;
  outputAppended: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  outputToAppend: null,
  appendOutput: (content) => set({ outputToAppend: { id: uuidv4(), content } }),
  outputAppended: () => set({ outputToAppend: null }),
}));
