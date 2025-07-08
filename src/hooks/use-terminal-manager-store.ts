"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { TerminalSessionType } from '@/types';
import { toast } from 'sonner';

interface TerminalManagerState {
    terminals: TerminalSessionType[];
    activeTerminalId: string | null;
    addTerminal: () => void;
    removeTerminal: (terminalId: string) => void;
    updateTerminal: (id: string, updates: Partial<TerminalSessionType>) => void;
    setActiveTerminalId: (id: string) => void;
    reset: () => void;
}

const createNewTerminal = (title: string): TerminalSessionType => ({
    _id: uuidv4(),
    title,
    commands: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
});

const initialTerminals = [createNewTerminal('Terminal 1')];

export const useTerminalManager = create<TerminalManagerState>()(
    persist(
        (set, get) => ({
            terminals: initialTerminals,
            activeTerminalId: initialTerminals[0]._id,
            addTerminal: () => {
                const { terminals } = get();
                const newTerminal = createNewTerminal(`Terminal ${terminals.length + 1}`);
                set({ 
                    terminals: [...terminals.map(t => ({...t, isActive: false})), newTerminal],
                    activeTerminalId: newTerminal._id
                });
            },
            removeTerminal: (terminalId: string) => {
                const { terminals, activeTerminalId } = get();
                if (terminals.length <= 1) {
                    toast.info("Cannot close the last terminal.");
                    return;
                }
                const newTerminals = terminals.filter(t => t._id !== terminalId);
                let newActiveId = activeTerminalId;
                if (activeTerminalId === terminalId) {
                    newActiveId = newTerminals[0]._id;
                    const activeIndex = newTerminals.findIndex(t => t._id === newActiveId);
                    if (activeIndex !== -1) {
                        newTerminals[activeIndex].isActive = true;
                    }
                }
                set({ terminals: newTerminals, activeTerminalId: newActiveId });
            },
            updateTerminal: (id: string, updates: Partial<TerminalSessionType>) => {
                set(state => ({
                    terminals: state.terminals.map(t => t._id === id ? {...t, ...updates, updatedAt: new Date()} : t)
                }));
            },
            setActiveTerminalId: (id: string) => {
                set(state => ({
                    terminals: state.terminals.map(t => ({...t, isActive: t._id === id})),
                    activeTerminalId: id
                }));
            },
            reset: () => {
                const newTerminals = [createNewTerminal('Terminal 1')];
                set({
                    terminals: newTerminals,
                    activeTerminalId: newTerminals[0]._id
                });
            }
        }),
        {
            name: 'codeverse-terminal-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
