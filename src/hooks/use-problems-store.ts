import { create } from 'zustand';
import type { Problem } from '@/types';

interface ProblemsState {
  problems: Problem[];
  setProblems: (problems: Problem[]) => void;
  clearProblems: () => void;
}

export const useProblemsStore = create<ProblemsState>((set) => ({
  problems: [],
  setProblems: (problems) => set({ problems }),
  clearProblems: () => set({ problems: [] }),
}));
