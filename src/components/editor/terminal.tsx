
"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
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
import { useRouter } from "next/navigation";

const prompt = (path: string) => `\r\n\x1b[1;34m${path}\x1b[0m $ `;

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
  const { outputToAppend, outputAppended } = useTerminalStore();
  const { allFiles, deleteFile, activeFileId, getPathForFile } = useFileSystem();
  const router = useRouter();

  const [currentPath, setCurrentPath] = useState('/');
  const [currentLine, setCurrentLine] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(terminal.commands || []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pathMap = useMemo(() => {
    const map = new Map<string, FileType>();
    allFiles.forEach(file => {
      const path = getPathForFile(file._id);
      map.set(path, file);
    });
    // Add root
    const rootChildren = allFiles.filter(f => !f.parentId);
    map.set('/', { _id: 'root', name: '/', isFolder: true, content: '', parentId: null, language: '', isOpen: false, isActive: false, createdAt: new Date(), updatedAt: new Date(), children: rootChildren });
    return map;
  }, [allFiles, getPathForFile]);

  const findNodeByPath = (currentDir: string, targetPath: string): FileType | null => {
      let resolvedPath: string;
      if (targetPath.startsWith('/')) {
          resolvedPath = targetPath; // Absolute path
      } else {
          // Relative path
          const pathParts = currentDir.split('/').filter(Boolean);
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

      if (resolvedPath.length > 1 && resolvedPath.endsWith('/')) {
        resolvedPath = resolvedPath.slice(0, -1);
      }

      return pathMap.get(resolvedPath) || null;
  };

  const debouncedUpdate = useCallback(debounce((updates: Partial<TerminalSessionType>) => {
      onUpdate(terminal._id, updates);
  }, 1000), [terminal._id, onUpdate]);

  const writeOutput = (output: string) => {
    if (!xterm.current) return;
    xterm.current.write(output.replace(/\n/g, '\r\n'));
  };

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
            writeOutput(`\r\n${cmd}: missing file path`);
            return;
        }
        
        const fileToRun = findNodeByPath(currentPath, pathArg);
        const langConfig = fileToRun ? getLanguageConfigFromFilename(fileToRun.name) : null;
        
        if (fileToRun && !fileToRun.isFolder && langConfig && langConfig.judge0Id) {
            writeOutput(`\r\n\x1b[33mExecuting ${fileToRun.name} with ${langConfig.name} runtime...\x1b[0m\r\n`);
            const result = await executeCode(fileToRun.content, langConfig.judge0Id, fileToRun.name);
            
            if (result.compileError) {
                 writeOutput(`\r\n\x1b[1;31mCompilation Error:\r\n${result.compileError}\x1b[0m`);
            }
            if (result.logs.length > 0) {
                writeOutput(result.logs.join('\n'));
            }
            if (result.errorLogs.length > 0) {
                 writeOutput(`\r\n\x1b[1;31m${result.errorLogs.join('\n')}\x1b[0m`);
            }
            if (result.executionError) {
                 writeOutput(`\r\n\x1b[1;31mExecution Error: ${result.executionError}\x1b[0m`);
            }
            
            if(result.hasError) {
                 writeOutput(`\r\n\x1b[33mExecution finished with errors.\x1b[0m`);
            } else {
                 writeOutput(`\r\n\x1b[32mExecution finished successfully.\x1b[0m`);
            }
        } else {
            writeOutput(`\r\n${cmd}: cannot execute '${pathArg}'. Not a valid or runnable file.`);
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
            writeOutput('\r\nAvailable commands:\r\n');
            writeOutput('  ls              - List directory contents\r\n');
            writeOutput('  cd [dir]        - Change directory\r\n');
            writeOutput('  cat [file]      - Display file content\r\n');
            writeOutput('  rm [file/dir]   - Remove a file or directory (-r for recursive)\r\n');
            writeOutput('  pwd             - Print working directory\r\n');
            writeOutput('  echo [text]     - Display a line of text\r\n');
            writeOutput('  clear           - Clear the terminal screen\r\n');
            writeOutput('  help            - Show this help message\r\n');
            writeOutput('\r\nExecution commands:\r\n');
            writeOutput(`  ${runners} [file]`);
            break;
        case 'ls':
            const currentNode = findNodeByPath(currentPath, '.');
            if (currentNode && currentNode.isFolder) {
              const children = allFiles.filter(f => f.parentId === currentNode._id);
              if (children.length === 0) {
                  writeOutput('\r\n(empty)');
              } else {
                  writeOutput('\r\n');
                  children.forEach(child => {
                      writeOutput(`${child.isFolder ? `\x1b[1;34m${child.name}\x1b[0m` : child.name}\r\n`);
                  });
              }
            }
            break;
        case 'cd':
            const target = args[0] || '/';
            const node = findNodeByPath(currentPath, target);
            if (node && node.isFolder) {
                const newPath = getPathForFile(node._id) || '/';
                setCurrentPath(newPath);
            } else {
                writeOutput(`\r\ncd: no such file or directory: ${target}`);
            }
            break;
        case 'cat':
            const filename = args[0];
            if (!filename) {
                writeOutput('\r\ncat: missing operand');
                break;
            }
            const fileToRead = findNodeByPath(currentPath, filename);

            if (fileToRead && !fileToRead.isFolder) {
                writeOutput(`\r\n${fileToRead.content}`);
            } else {
                writeOutput(`\r\ncat: ${filename}: No such file or it's a directory`);
            }
            break;
        case 'rm':
            const pathArg = args[0];
            const recursive = args[0] === '-r' || args[0] === '-R';
            const targetPath = recursive ? args[1] : args[0];

            if (!targetPath) {
                writeOutput('\r\nrm: missing operand');
                break;
            }

            const itemToDelete = findNodeByPath(currentPath, targetPath);

            if (!itemToDelete || itemToDelete._id === 'root') {
                 writeOutput(`\r\nrm: cannot remove '${targetPath}': No such file or directory`);
                 break;
            }
            if (itemToDelete.isFolder && !recursive) {
                 writeOutput(`\r\nrm: cannot remove '${targetPath}': Is a directory. Use -r to remove directories.`);
                 break;
            }
            
            const wasActive = activeFileId === itemToDelete._id;
            const { nextActiveFileId } = await deleteFile(itemToDelete._id);
            
            if (wasActive) {
                if (nextActiveFileId) {
                    router.replace(`/editor/${nextActiveFileId}`);
                } else {
                    router.replace('/editor');
                }
            }
            writeOutput(`\r\nRemoved '${targetPath}'`);

            break;
        case 'pwd':
            writeOutput(`\r\n${currentPath}`);
            break;
        case 'echo':
            writeOutput(`\r\n${args.join(' ')}`);
            break;
        case 'clear':
            term.clear();
            break;
        case '':
            break;
        default:
            writeOutput(`\r\nCommand not found: ${cmd}. Type 'help' for a list of commands.`);
            break;
    }
    term.write(prompt(currentPath));
  }, [commandHistory, currentPath, debouncedUpdate, allFiles, activeFileId, deleteFile, router, findNodeByPath, getPathForFile]);

  useEffect(() => {
    if (terminalRef.current && !xterm.current) {
        const term = new XTerminal({
            cursorBlink: true,
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 14,
            allowProposedApi: true,
            convertEol: true,
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
            else if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                 setCurrentLine(currentLine + key);
                 term.write(key);
            }
        });

        writeOutput('Welcome to CodeVerse Terminal!\r\n');
        writeOutput("Type 'help' for a list of available commands.");
        term.write(prompt(currentPath));
    }

    const resizeObserver = new ResizeObserver(() => {
        if(terminalRef.current && terminalRef.current.clientWidth > 0 && fitAddon.current) {
            try {
                fitAddon.current.fit();
            } catch(e) {}
        }
    });

    if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
    }
    return () => {
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeTerminalId === terminal._id && fitAddon.current) {
        if (terminalRef.current && terminalRef.current.clientWidth > 0) {
           try { fitAddon.current.fit(); } catch(e) {}
        }
    }
  }, [activeTerminalId, terminal._id]);

  useEffect(() => {
    if (xterm.current) {
        xterm.current.options.theme = theme === 'dark' ? {
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            cursor: "hsl(var(--foreground))",
            selectionBackground: "hsl(var(--accent))",
            selectionForeground: "hsl(var(--accent-foreground))",
        } : {
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            cursor: "hsl(var(--foreground))",
            selectionBackground: "hsl(var(--accent))",
            selectionForeground: "hsl(var(--accent-foreground))",
        };
    }
  }, [theme]);
  
  useEffect(() => {
    if (outputToAppend?.id && xterm.current && xterm.current.element) {
        writeOutput(outputToAppend.content);
        xterm.current.write(prompt(currentPath));
        outputAppended();
    }
  }, [outputToAppend, outputAppended, currentPath]);

  useEffect(() => {
      if (xterm.current) {
          xterm.current.write('\x1b[2K\r' + prompt(currentPath) + currentLine);
      }
  }, [currentPath]);

  return (
    <div ref={terminalRef} className="h-full w-full p-2" />
  );
}
