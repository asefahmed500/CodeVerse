"use client";

import { create } from 'zustand';
import type { FileType } from '@/types';
import { useEditorStore } from './use-editor-store';
import { toast } from 'sonner';

const simpleParse = (code: string) => {
    const vars = new Map<string, any>();
    const varRegex = /(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);?/g;
    let match;
    while ((match = varRegex.exec(code)) !== null) {
        try {
            // Unsafe eval is acceptable for this simulation
            const value = new Function(`return ${match[2].trim()}`)();
            vars.set(match[1], value);
        } catch (e) {
            vars.set(match[1], match[2].trim());
        }
    }
    return Object.fromEntries(vars);
}

interface DebugState {
    isDebugging: boolean;
    isPaused: boolean;
    currentLine: number | null;
    activeFile: FileType | null;
    variables: Record<string, any>;
    start: (file: FileType, breakpoints: number[]) => void;
    stop: () => void;
    step: () => void;
    continue: () => void;
}

export const useDebugStore = create<DebugState>((set, get) => ({
    isDebugging: false,
    isPaused: false,
    currentLine: null,
    activeFile: null,
    variables: {},
    
    start: (file, breakpoints) => {
        const sortedBreakpoints = [...breakpoints].sort((a, b) => a - b);
        const firstBreakpoint = sortedBreakpoints[0];
        
        if (!firstBreakpoint) {
            toast.info("No breakpoints set. Add a breakpoint to start debugging.");
            return;
        }

        set({
            isDebugging: true,
            isPaused: true,
            activeFile: file,
            currentLine: firstBreakpoint,
            variables: simpleParse(file.content.split('\n').slice(0, firstBreakpoint).join('\n'))
        });
        toast.success(`Debugging started. Paused at line ${firstBreakpoint}.`);
    },

    stop: () => {
        set({ isDebugging: false, isPaused: false, currentLine: null, activeFile: null, variables: {} });
        toast.error("Debugging session stopped.");
    },

    step: () => {
        if (!get().isPaused) return;
        const { activeFile, currentLine } = get();
        if (activeFile && currentLine) {
            const nextLine = currentLine + 1;
            const totalLines = activeFile.content.split('\n').length;
            if (nextLine <= totalLines) {
                 set({ 
                     currentLine: nextLine,
                     variables: simpleParse(activeFile.content.split('\n').slice(0, nextLine).join('\n'))
                 });
            } else {
                toast.success("End of file reached. Debugging finished.");
                get().stop();
            }
        }
    },
    
    continue: () => {
        if (!get().isPaused) return;
        const { activeFile, currentLine } = get();
        if (!activeFile) return;

        const breakpoints = useEditorStore.getState().breakpoints[activeFile._id] || [];
        const sortedBreakpoints = [...breakpoints].sort((a, b) => a - b);
        const nextBreakpoint = sortedBreakpoints.find(bp => bp > (currentLine || 0));

        if (nextBreakpoint) {
            set({ 
                currentLine: nextBreakpoint,
                variables: simpleParse(activeFile.content.split('\n').slice(0, nextBreakpoint).join('\n'))
            });
            toast.info(`Continued to breakpoint at line ${nextBreakpoint}.`);
        } else {
            toast.success("No more breakpoints. Debugging finished.");
            get().stop();
        }
    },
}));
