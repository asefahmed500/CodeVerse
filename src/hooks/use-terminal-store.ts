"use client";

import { create } from "zustand";

interface TerminalState {
  commandToRun: string | null;
  runCommand: (command: string) => void;
  commandProcessed: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  commandToRun: null,
  runCommand: (command) => set({ commandToRun: command }),
  commandProcessed: () => set({ commandToRun: null }),
}));
