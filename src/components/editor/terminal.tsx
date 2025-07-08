"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import type { FileType, TerminalSessionType } from "@/types";
import { useTheme } from "next-themes";
import { debounce } from "@/lib/utils";
import { useTerminalStore } from "@/hooks/use-terminal-store";
import { executeCode } from "@/lib/code-runner";
import { getLanguageConfigFromFilename } from "@/config/languages";
import { useFileSystem } from "@/hooks/use-file-system";

const prompt = (path: string) => `\r\n\x1b[1;34m${path}\x1b[0m $ `;

const getChildrenOfPath = (allFiles: FileType[], path: string): FileType[] => {
    if (path === '/') {
        return allFiles.filter(f => !f.parentId);
    }
    const parent = findNodeByPath(allFiles, path);
    if (parent && parent.isFolder) {
        return allFiles.filter(f => f.parentId === parent._id);
    }
    return [];
};

const findNodeByPath = (allFiles: FileType[], path: string): FileType | null => {
    if (path === '/') {
        // This is a virtual root, not a real file object
        return { _id: 'root', name: '/', isFolder: true, children: allFiles.filter(f => !f.parentId) } as any;
    }
    
    const parts = path.split('/').filter(Boolean);
    let currentNode: FileType | null = null;
    let currentChildren = allFiles.filter(f => !f.parentId);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const foundNode = currentChildren.find(c => c.name === part);
        if (!foundNode) return null;

        currentNode = foundNode;
        if (foundNode.isFolder) {
            currentChildren = allFiles.filter(f => f.parentId === foundNode._id);
        } else if (i < parts.length - 1) {
            // It's a file, but not the last part of the path
            return null;
        }
    }
    return currentNode;
};


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
  const { commandToRun, commandProcessed } = useTerminalStore();
  const { allFiles } = useFileSystem();

  const [currentPath, setCurrentPath] = useState('/');
  const [currentLine, setCurrentLine] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(terminal.commands || []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const debouncedUpdate = useCallback(debounce((updates: Partial<TerminalSessionType>) => {
      onUpdate(terminal._id, updates);
  }, 1000), [terminal._id, onUpdate]);

  const executeCommand = useCallback(async (command: string) => {
    if (!xterm.current) return;

    const [cmd, ...args] = command.trim().split(' ');
    const term = xterm.current;
    
    if(command.trim()){
        const newHistory = [command.trim(), ...commandHistory];
        setCommandHistory(newHistory);
        debouncedUpdate({ commands: newHistory });
    }

    switch (cmd) {
        case 'help':
            term.writeln('\r\nAvailable commands:');
            term.writeln('  ls              - List directory contents');
            term.writeln('  cd [dir]        - Change directory');
            term.writeln('  cat [file]      - Display file content');
            term.writeln('  pwd             - Print working directory');
            term.writeln('  echo [text]     - Display a line of text');
            term.writeln('  clear           - Clear the terminal screen');
            term.writeln('  help            - Show this help message');
            term.writeln('\r\nExecution commands:');
            term.writeln('  node [file]     - Execute a JS/TS file');
            term.writeln('  python [file]   - Execute a Python file');
            term.writeln('  run-java [file] - Compile and run a Java file');
            term.writeln('  run-c [file]    - Compile and run a C file');
            term.writeln('  run-cpp [file]  - Compile and run a C++ file');
            term.writeln('  run-csharp [file]- Compile and run a C# file');
            term.writeln('  run-go [file]   - Compile and run a Go file');
            term.writeln('  run-php [file]  - Execute a PHP file');
            term.writeln('  run-ruby [file] - Execute a Ruby file');
            term.writeln('  run-rust [file] - Compile and run a Rust file');
            break;
        case 'ls':
            const children = getChildrenOfPath(allFiles, currentPath);
            if (children.length === 0) {
                term.writeln('\r\n(empty)');
            } else {
                term.writeln('');
                children.forEach(child => {
                    term.writeln(`\r${child.isFolder ? `\x1b[1;34m${child.name}\x1b[0m` : child.name}`);
                });
            }
            break;
        case 'cd':
            const target = args[0] || '/';
            if (target === '..') {
                const newPath = currentPath === '/' ? '/' : currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
                setCurrentPath(newPath);
            } else {
                const newPath = target.startsWith('/') ? target : `${currentPath === '/' ? '' : currentPath}/${target}`;
                const node = findNodeByPath(allFiles, newPath);
                if (node && node.isFolder) {
                    setCurrentPath(newPath);
                } else if (newPath === '/') {
                    setCurrentPath('/');
                } else {
                    term.writeln(`\r\ncd: no such file or directory: ${target}`);
                }
            }
            break;
        case 'cat':
            const filename = args[0];
            if (!filename) {
                term.writeln('\r\ncat: missing operand');
                break;
            }
            const fileChildren = getChildrenOfPath(allFiles, currentPath);
            const fileToRead = fileChildren.find(f => f.name === filename && !f.isFolder);
            if (fileToRead) {
                term.writeln(`\r\n${fileToRead.content.replace(/\n/g, '\r\n')}`);
            } else {
                term.writeln(`\r\ncat: ${filename}: No such file`);
            }
            break;
        case 'pwd':
            term.writeln(`\r\n${currentPath}`);
            break;
        case 'echo':
            term.writeln(`\r\n${args.join(' ')}`);
            break;
        case 'clear':
            term.clear();
            break;
        case 'node':
        case 'python':
        case 'run-java':
        case 'run-c':
        case 'run-cpp':
        case 'run-csharp':
        case 'run-go':
        case 'run-php':
        case 'run-ruby':
        case 'run-rust':
            const pathArg = args[0];
            if (!pathArg) {
                term.writeln(`\r\n${cmd}: missing file path`);
                break;
            }
            const fullPath = pathArg.startsWith('/') ? pathArg : `${currentPath === '/' ? '' : currentPath}/${pathArg}`;
            const fileToRun = findNodeByPath(allFiles, fullPath);
            const langConfig = fileToRun ? getLanguageConfigFromFilename(fileToRun.name) : null;
            
            if (fileToRun && !fileToRun.isFolder && langConfig && langConfig.judge0Id) {
                term.writeln(`\r\n\x1b[33mExecuting ${fileToRun.name} with ${langConfig.name} runtime...\x1b[0m`);
                const { logs, error } = await executeCode(fileToRun.content, langConfig.judge0Id);
                term.writeln('');
                if (logs.length > 0) {
                    term.writeln('\r\x1b[1;32mOutput:\x1b[0m');
                    logs.forEach(log => term.writeln(`\r${log}`));
                }
                if (error) {
                    term.writeln(`\r\x1b[1;31mError: ${error}\x1b[0m`);
                }
            } else {
                term.writeln(`\r\n${cmd}: cannot execute '${pathArg}'. Not a valid or runnable file.`);
            }
            break;
        case '':
            break;
        default:
            term.writeln(`\r\nCommand not found: ${cmd}. Type 'help' for a list of commands.`);
            break;
    }
  }, [commandHistory, currentPath, debouncedUpdate, allFiles]);


  useEffect(() => {
    if (!terminalRef.current || xterm.current) return;
    
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
        if (!xterm.current) return;
        
        switch (e) {
            case '\r': // Enter
                executeCommand(currentLine);
                setCurrentLine('');
                setHistoryIndex(-1);
                xterm.current.write(prompt(currentPath));
                break;
            case '\u007F': // Backspace
                if (currentLine.length > 0) {
                    xterm.current.write('\b \b');
                    setCurrentLine(currentLine.slice(0, -1));
                }
                break;
            case '\u001b[A': // Up arrow
                if (historyIndex < commandHistory.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    const cmd = commandHistory[newIndex];
                    xterm.current.write('\x1b[2K\r' + prompt(currentPath) + cmd);
                    setCurrentLine(cmd);
                }
                break;
            case '\u001b[B': // Down arrow
                if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    const cmd = commandHistory[newIndex];
                    xterm.current.write('\x1b[2K\r' + prompt(currentPath) + cmd);
                    setCurrentLine(cmd);
                } else {
                    setHistoryIndex(-1);
                    xterm.current.write('\x1b[2K\r' + prompt(currentPath));
                    setCurrentLine('');
                }
                break;
            default:
                if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7e)) {
                    setCurrentLine(currentLine + e);
                    xterm.current.write(e);
                }
        }
    });

    xterm.current.writeln('Welcome to CodeVerse Terminal!');
    xterm.current.writeln("Type 'help' for a list of available commands.");
    xterm.current.write(prompt(currentPath));
    
    fitAddon.current?.fit();
    const resizeObserver = new ResizeObserver(() => fitAddon.current?.fit());
    resizeObserver.observe(terminalRef.current);
    
    return () => {
      resizeObserver.disconnect();
      xterm.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (xterm.current) {
        xterm.current.options.theme = theme === 'dark' ? {
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            cursor: "hsl(var(--foreground))",
            selectionBackground: "hsl(var(--accent))",
            selectionForeground: "hsl(var(--accent-foreground))"
        } : {
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            cursor: "hsl(var(--foreground))",
            selectionBackground: "hsl(var(--accent))",
            selectionForeground: "hsl(var(--accent-foreground))"
        };
    }
  }, [theme]);
  
  useEffect(() => {
    if (commandToRun && xterm.current) {
      xterm.current.writeln(`\r\n\x1b[1;32m${prompt(currentPath)}${commandToRun}\x1b[0m`);
      executeCommand(commandToRun);
      commandProcessed();
      setTimeout(() => {
        xterm.current?.write(prompt(currentPath));
        xterm.current?.focus();
      }, 100);
    }
  }, [commandToRun, commandProcessed, executeCommand, currentPath]);
  
    useEffect(() => {
        if (xterm.current) {
            xterm.current.write('\x1b[2K\r' + prompt(currentPath) + currentLine);
        }
    }, [currentPath]);


  return (
    <div ref={terminalRef} className="h-full w-full p-2" />
  );
}
