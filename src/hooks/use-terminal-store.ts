
"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from 'uuid';

interface TerminalState {
  // For direct output injection (e.g., from code runner)
  outputToAppend: { id: string; content: string } | null;
  appendOutput: (content: string) => void;
  outputAppended: () => void;

  // For interactive shell commands
  commandToRun: { id: string; command: string } | null;
  runCommand: (command: string) => void;
  commandProcessed: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  outputToAppend: null,
  appendOutput: (content) => set({ outputToAppend: { id: uuidv4(), content } }),
  outputAppended: () => set({ outputToAppend: null }),
  
  commandToRun: null,
  runCommand: (command) => set({ commandToRun: { id: uuidv4(), command } }),
  commandProcessed: () => set({ commandToRun: null }),
}));
