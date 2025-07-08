"use client";

import Editor, { OnChange, type OnMount } from "@monaco-editor/react";
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
import { initVimMode } from 'monaco-vim';
import { getSnippets } from "@/config/snippets";

export function CodeEditor({ file }: { file: FileType }) {
  const { theme } = useTheme();
  const { updateFile } = useFileSystem();
  const { setEditor, setSaveHandler, setCursorPosition, breakpoints, toggleBreakpoint, editor } = useEditorStore();
  const { fontSize, tabSize, wordWrap, minimap, vimMode } = useEditorSettingsStore();

  const vimModeRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const immediateSave = useCallback((currentContent: string) => {
    updateFile(file._id, { content: currentContent });
    toast.success(`${file.name} saved.`);
  }, [file._id, file.name, updateFile]);
  
  const debouncedSave = useCallback(debounce(immediateSave, 2000), [immediateSave]);

  const handleEditorChange: OnChange = (value) => {
    const newContent = value || "";
    file.content = newContent;
    debouncedSave(newContent);
  };
  
  useEffect(() => {
    const handler = () => {
      immediateSave(file.content);
    };
    setSaveHandler(() => handler);
    return () => setSaveHandler(null);
  }, [immediateSave, file.content, setSaveHandler]);

  // Handle breakpoints
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

  // Handle Vim mode
  useEffect(() => {
    if (editorRef.current && vimMode) {
      vimModeRef.current = initVimMode(editorRef.current, document.createElement('div'));
    } else if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
    return () => {
      vimModeRef.current?.dispose();
    };
  }, [vimMode]);

  const handleEditorMount: OnMount = (mountedEditor, monaco) => {
    editorRef.current = mountedEditor;
    setEditor(mountedEditor);
    setCursorPosition(mountedEditor.getPosition());
    
    // Snippets
    const languageConfig = getLanguageConfigFromFilename(file.name);
    monaco.languages.registerCompletionItemProvider(languageConfig.monacoLanguage, {
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

    // Breakpoints
    mountedEditor.onMouseDown(e => {
      const target = e.target;
      if (target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && target.position) {
        toggleBreakpoint(file._id, target.position.lineNumber);
      }
    });

    mountedEditor.onDidChangeCursorPosition(e => {
      setCursorPosition(e.position);
    });

    mountedEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => immediateSave(mountedEditor.getValue())
    );

    mountedEditor.focus();
  };

  const editorOptions = {
    ...EDITOR_CONFIG,
    fontSize,
    tabSize,
    wordWrap,
    glyphMargin: true, // For breakpoints
    minimap: {
      ...EDITOR_CONFIG.minimap,
      enabled: minimap,
    },
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1">
        <Editor
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
