
"use client";

import MonacoEditor, { OnChange, type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import type { FileType } from "@/types";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { EDITOR_CONFIG } from "@/config/editor";
import { getLanguageConfigFromFilename } from "@/config/languages";
import { useFileSystem } from "@/hooks/use-file-system";
import { debounce } from "@/lib/utils";
import { useEditorStore } from "@/hooks/use-editor-store";
import { useEditorSettingsStore } from "@/hooks/use-editor-settings-store";
import { getSnippets } from "@/config/snippets";
import { useDebugStore } from "@/hooks/use-debug-store";
import type * as monaco from 'monaco-editor';

export function Editor({ initialFile }: { initialFile: FileType }) {
  const { theme } = useTheme();
  const { findFile, updateFile, updateFileContentLocally, setActiveFileId } = useFileSystem();

  // Defensive guard to prevent crash if an invalid prop is ever passed.
  if (!initialFile) {
    return null;
  }
  
  // The file from the store is the most up-to-date version, ensuring UI reflects local changes.
  const file = findFile(initialFile._id) || initialFile;

  const { setEditor, setSaveHandler, setCursorPosition, breakpoints, toggleBreakpoint, editor } = useEditorStore();
  const { fontSize, tabSize } = useEditorSettingsStore();
  const { isDebugging, isPaused, currentLine, activeFile: debugFile } = useDebugStore();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const debugDecorationsRef = useRef<string[]>([]);

  // Ensure the active file is set in the global state when the page loads
  useEffect(() => {
    setActiveFileId(file._id);
  }, [file._id, setActiveFileId]);

  const fileContentRef = useRef(file.content);
  useEffect(() => {
    fileContentRef.current = file.content;
  }, [file.content]);
  
  const immediateSave = useCallback(async (currentContent: string) => {
    const savedFile = await updateFile(file._id, { content: currentContent });
    if(savedFile) {
      toast.success(`${file.name} saved.`);
    }
  }, [file._id, file.name, updateFile]);
  
  const debouncedSave = useCallback(debounce(() => {
    updateFile(file._id, { content: fileContentRef.current });
  }, 2000), [file._id, updateFile]);

  const handleEditorChange: OnChange = (value) => {
    const newContent = value || "";
    fileContentRef.current = newContent;
    updateFileContentLocally(file._id, newContent); // Instant local update for responsive UI
    debouncedSave();
  };
  
  useEffect(() => {
    const handler = () => immediateSave(fileContentRef.current);
    setSaveHandler(() => handler);
    return () => setSaveHandler(null);
  }, [immediateSave, setSaveHandler]);

  useEffect(() => {
    if (editor) {
      const fileBreakpoints = breakpoints[file._id] || [];
      const newDecorations = fileBreakpoints.map(lineNumber => ({
        range: new editor.monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'breakpoint-glyph',
        }
      }));
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }
  }, [breakpoints, editor, file._id]);

  useEffect(() => {
    if (editor && monacoRef.current) {
        if (isDebugging && isPaused && debugFile?._id === file._id && currentLine) {
            const newDecorations = [{
                range: new monacoRef.current.Range(currentLine, 1, currentLine, 1),
                options: {
                    isWholeLine: true,
                    className: 'debug-line-highlight',
                    overviewRuler: {
                        color: 'rgba(255, 255, 0, 0.5)',
                        position: monacoRef.current.editor.OverviewRulerLane.Full
                    }
                }
            }];
            debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, newDecorations);
            editor.revealLineInCenter(currentLine);
        } else {
            debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, []);
        }
    }
}, [isDebugging, isPaused, currentLine, debugFile, file._id, editor]);


  const handleEditorMount: OnMount = (mountedEditor, monacoInstance) => {
    editorRef.current = mountedEditor;
    monacoRef.current = monacoInstance;
    setEditor(mountedEditor);
    setCursorPosition(mountedEditor.getPosition());
    
    const languageConfig = getLanguageConfigFromFilename(file.name);
    monacoInstance.languages.registerCompletionItemProvider(languageConfig.monacoLanguage, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = getSnippets(languageConfig.monacoLanguage).map(s => ({...s, range}));
        return { suggestions };
      },
    });

    mountedEditor.onMouseDown(e => {
      const target = e.target;
      if (target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && target.position) {
        toggleBreakpoint(file._id, target.position.lineNumber);
      }
    });

    mountedEditor.onDidChangeCursorPosition(e => {
      setCursorPosition(e.position);
    });

    mountedEditor.addCommand(
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        () => immediateSave(mountedEditor.getValue())
    );

    mountedEditor.focus();
  };

  const editorOptions = {
    ...EDITOR_CONFIG,
    fontSize,
    tabSize,
    glyphMargin: true,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          path={file.name}
          defaultLanguage={getLanguageConfigFromFilename(file.name).monacoLanguage}
          theme={theme === "dark" ? "vs-dark" : "light"}
          defaultValue={file.content}
          onChange={handleEditorChange}
          options={editorOptions}
          onMount={handleEditorMount}
          key={file._id}
        />
      </div>
    </div>
  );
}
