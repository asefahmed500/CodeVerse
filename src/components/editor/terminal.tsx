"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import type { TerminalSessionType } from "@/types";
import { useTheme } from "next-themes";
import { debounce } from "@/lib/utils";

const prompt = "\n\r$ ";

export function Terminal({
  terminal,
  onUpdate,
}: {
  terminal: TerminalSessionType;
  onUpdate: (id: string, updates: Partial<TerminalSessionType>) => void;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xterm = useRef<XTerminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const { theme } = useTheme();

  const debouncedUpdate = useCallback(debounce((content: string) => {
      onUpdate(terminal._id, { content });
  }, 1000), [terminal._id, onUpdate]);

  useEffect(() => {
    if (!terminalRef.current) return;
    
    if (!xterm.current) {
        xterm.current = new XTerminal({
            cursorBlink: true,
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 14,
            allowProposedApi: true,
        });
        
        fitAddon.current = new FitAddon();
        xterm.current.loadAddon(fitAddon.current);

        xterm.current.open(terminalRef.current);
        
        xterm.current.onData(e => {
            xterm.current?.write(e);
            const currentContent = xterm.current!.buffer.active.getLine(xterm.current!.buffer.active.baseY + xterm.current!.buffer.active.cursorY)?.translateToString(true) || '';
            debouncedUpdate(currentContent);
        });

        xterm.current.writeln(terminal.content || 'Welcome to CodeVerse Terminal!');
        xterm.current.write(prompt);
    }
    
    fitAddon.current?.fit();
    const resizeObserver = new ResizeObserver(() => fitAddon.current?.fit());
    resizeObserver.observe(terminalRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (xterm.current) {
        xterm.current.options.theme = theme === 'dark' ? {
            background: "#1e1e1e",
            foreground: "#cccccc",
            cursor: "#ffffff",
        } : {
            background: "#ffffff",
            foreground: "#333333",
            cursor: "#000000",
        };
    }
  }, [theme]);

  return (
    <div ref={terminalRef} className="h-full w-full p-2" />
  );
}
