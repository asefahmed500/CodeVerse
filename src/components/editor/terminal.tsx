
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
import { LANGUAGE_CONFIG, getLanguageConfigFromFilename } from "@/config/languages";
import { useFileSystem } from "@/hooks/use-file-system";
import { useTerminalManager } from "@/hooks/use-terminal-manager-store";

const prompt = (path: string) => `\r\n\x1b[1;34m${path}\x1b[0m $ `;

const findNodeByPath = (allFiles: FileType[], currentPath: string, targetPath: string): FileType | null => {
    let resolvedPath: string;
    if (targetPath.startsWith('/')) {
        resolvedPath = targetPath; // Absolute path
    } else {
        // Relative path
        const pathParts = currentPath.split('/').filter(Boolean);
        const targetParts = targetPath.split('/');

        for (const part of targetParts) {
            if (part === '..') {
                pathParts.pop();
            } else if (part !== '.') {
                pathParts.push(part);
            }
        }
        resolvedPath = '/' + pathParts.join('/');
    }

    if (resolvedPath === '/') {
        const rootChildren = allFiles.filter(f => !f.parentId);
        return { _id: 'root', name: '/', isFolder: true, content: '', parentId: null, language: '', isOpen: false, isActive: false, createdAt: new Date(), updatedAt: new Date(), children: rootChildren };
    }
    
    const parts = resolvedPath.split('/').filter(Boolean);
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
            return null; // It's a file, but not the last part of the path
        }
    }
    return currentNode;
};

const runnerCommands = new Set(
    Object.values(LANGUAGE_CONFIG)
        .map(lang => lang.runner)
        .filter((runner): runner is string => !!runner)
);


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
  const { activeTerminalId } = useTerminalManager();
  const { commandToRun, commandProcessed, outputToAppend, outputAppended } = useTerminalStore();
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

    const runFile = async () => {
        const pathArg = args[0];
        if (!pathArg) {
            term.writeln(`\r\n${cmd}: missing file path`);
            return;
        }
        
        const fileToRun = findNodeByPath(allFiles, currentPath, pathArg);
        const langConfig = fileToRun ? getLanguageConfigFromFilename(fileToRun.name) : null;
        
        if (fileToRun && !fileToRun.isFolder && langConfig && langConfig.judge0Id) {
            term.writeln(`\r\n\x1b[33mExecuting ${fileToRun.name} with ${langConfig.name} runtime...\x1b[0m`);
            const result = await executeCode(fileToRun.content, langConfig.judge0Id);
            
            term.writeln(''); // new line

            if (result.logs.length > 0) {
                result.logs.forEach(log => term.writeln(`\r${log}`));
            }
            if (result.errorLogs.length > 0) {
                result.errorLogs.forEach(log => term.writeln(`\r\x1b[1;31m${log}\x1b[0m`));
            }
             if (result.compileError) {
                 term.writeln(`\r\x1b[1;31mCompilation Error:\x1b[0m`);
                 result.compileError.split('\n').forEach(line => term.writeln(`\r\x1b[1;31m  ${line}\x1b[0m`));
            }
            if (result.executionError) {
                 term.writeln(`\r\x1b[1;31mExecution Error: ${result.executionError}\x1b[0m`);
            }

            if(result.hasError) {
                 term.writeln(`\r\n\x1b[33mExecution finished with errors.\x1b[0m`);
            } else {
                 term.writeln(`\r\n\x1b[32mExecution finished successfully.\x1b[0m`);
            }
        } else {
            term.writeln(`\r\n${cmd}: cannot execute '${pathArg}'. Not a valid or runnable file.`);
        }
    }

    if(runnerCommands.has(cmd)) {
        await runFile();
        term.write(prompt(currentPath));
        return;
    }

    switch (cmd) {
        case 'help':
            const runners = Array.from(runnerCommands).join(', ');
            term.writeln('\r\nAvailable commands:');
            term.writeln('  ls              - List directory contents');
            term.writeln('  cd [dir]        - Change directory');
            term.writeln('  cat [file]      - Display file content');
            term.writeln('  pwd             - Print working directory');
            term.writeln('  echo [text]     - Display a line of text');
            term.writeln('  clear           - Clear the terminal screen');
            term.writeln('  help            - Show this help message');
            term.writeln('\r\nExecution commands:');
            term.writeln(`  ${runners} [file]`);
            break;
        case 'ls':
            const children = findNodeByPath(allFiles, currentPath, '.')?.children || [];
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
            const node = findNodeByPath(allFiles, currentPath, target);
            if (node && node.isFolder) {
                const pathParts = node._id === 'root' ? [] : (useFileSystem.getState().getPathForFile(node._id)).split('/');
                setCurrentPath('/' + pathParts.filter(Boolean).join('/'));
            } else {
                term.writeln(`\r\ncd: no such file or directory: ${target}`);
            }
            break;
        case 'cat':
            const filename = args[0];
            if (!filename) {
                term.writeln('\r\ncat: missing operand');
                break;
            }
            const fileToRead = findNodeByPath(allFiles, currentPath, filename);

            if (fileToRead && !fileToRead.isFolder) {
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
        case '':
            break;
        default:
            term.writeln(`\r\nCommand not found: ${cmd}. Type 'help' for a list of commands.`);
            break;
    }
    term.write(prompt(currentPath));
  }, [commandHistory, currentPath, debouncedUpdate, allFiles]);


  useEffect(() => {
    // Initialize terminal on mount
    if (terminalRef.current && !xterm.current) {
        const term = new XTerminal({
            cursorBlink: true,
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 14,
            allowProposedApi: true,
        });
        xterm.current = term;

        const addon = new FitAddon();
        fitAddon.current = addon;
        term.loadAddon(addon);
        term.open(terminalRef.current);
        
        term.onKey(({ key, domEvent: e }) => {
            if (e.key === 'Enter') {
                executeCommand(currentLine);
                setCurrentLine('');
                setHistoryIndex(-1);
            } else if (e.key === 'Backspace') {
                if (currentLine.length > 0) {
                    term.write('\b \b');
                    setCurrentLine(currentLine.slice(0, -1));
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    const cmd = commandHistory[newIndex];
                    term.write('\x1b[2K\r' + prompt(currentPath) + cmd);
                    setCurrentLine(cmd);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    const cmd = commandHistory[newIndex];
                    term.write('\x1b[2K\r' + prompt(currentPath) + cmd);
                    setCurrentLine(cmd);
                } else {
                     setHistoryIndex(-1);
                     term.write('\x1b[2K\r' + prompt(currentPath));
                     setCurrentLine('');
                }
            }
            else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                 if (key >= String.fromCharCode(0x20) && key <= String.fromCharCode(0x7e) || key.length > 1) {
                    setCurrentLine(currentLine + key);
                    term.write(key);
                }
            }
        });

        term.writeln('Welcome to CodeVerse Terminal!');
        term.writeln("Type 'help' for a list of available commands.");
        term.write(prompt(currentPath));
    }

    // Set up ResizeObserver to handle fitting
    const resizeObserver = new ResizeObserver(() => {
        if(terminalRef.current && terminalRef.current.clientWidth > 0 && fitAddon.current) {
            try {
                fitAddon.current.fit();
            } catch(e) {
                 // Can safely ignore fit errors on rapid resize
            }
        }
    });

    if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
    }

    return () => {
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
      if (xterm.current) {
        // Only dispose if it's truly the last unmount
        // xterm.current.dispose();
        // xterm.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // This effect handles theme changes.
    if (xterm.current) {
        xterm.current.options.theme = theme === 'dark' ? {
            background: "#2C3333",
            foreground: "#FFFFFF",
            cursor: "#FFFFFF",
            selectionBackground: "#00FFFF",
            selectionForeground: "#000000",
        } : {
            background: "#FFFFFF",
            foreground: "#000000",
            cursor: "#000000",
            selectionBackground: "#ADD8E6",
            selectionForeground: "#000000",
        };
    }
  }, [theme]);
  
  useEffect(() => {
    // Effect to run external commands (like from code runner)
    if (commandToRun && xterm.current) {
      xterm.current.write(`\r\n\x1b[1;32m${prompt(currentPath)}${commandToRun.command}\x1b[0m`);
      executeCommand(commandToRun.command);
      commandProcessed();
    }
  }, [commandToRun, commandProcessed, executeCommand, currentPath]);
  
  useEffect(() => {
    // Effect to append output (like from code runner)
    if (outputToAppend?.id && xterm.current && xterm.current.element) {
        xterm.current.write(outputToAppend.content);
        xterm.current.write(prompt(currentPath));
        outputAppended();
    }
  }, [outputToAppend, outputAppended, currentPath]);

    useEffect(() => {
        // Effect to update prompt when path changes
        if (xterm.current) {
            xterm.current.write('\x1b[2K\r' + prompt(currentPath) + currentLine);
        }
    }, [currentPath]);


  return (
    <div ref={terminalRef} className="h-full w-full p-2" />
  );
}
