"use client";

import Editor, { OnChange, type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";
import type { FileType } from "@/types";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { EDITOR_CONFIG } from "@/config/editor";
import { getLanguageConfigFromFilename } from "@/config/languages";
import { useFileSystem } from "@/hooks/use-file-system";
import { debounce } from "@/lib/utils";
import { useEditorStore } from "@/hooks/use-editor-store";

export function CodeEditor({ file }: { file: FileType }) {
  const { theme } = useTheme();
  const [content, setContent] = useState(file.content);
  const { updateFile } = useFileSystem();
  const { setEditor, setSaveHandler, setCursorPosition } = useEditorStore();

  useEffect(() => {
    setContent(file.content);
  }, [file.content]);

  const immediateSave = useCallback(async (currentContent: string) => {
    try {
      await updateFile(file._id, { content: currentContent });
      toast.success(`${file.name} saved.`);
    } catch (error) {
      toast.error(`Failed to save ${file.name}`);
    }
  }, [file._id, file.name, updateFile]);
  
  // Debounced save for auto-saving on change
  const debouncedSave = useCallback(debounce(immediateSave, 2000), [immediateSave]);

  const handleEditorChange: OnChange = (value) => {
    const newContent = value || "";
    setContent(newContent);
    debouncedSave(newContent);
  };
  
  useEffect(() => {
    // Register the immediate save function for external triggers (e.g., menu bar)
    setSaveHandler(() => immediateSave);
    return () => {
      setSaveHandler(null);
    };
  }, [immediateSave, setSaveHandler]);

  useEffect(() => {
    // Cleanup editor instance and cursor position on unmount
    return () => {
      setEditor(null);
      setCursorPosition(null);
    };
  }, [setEditor, setCursorPosition]);

  const handleEditorMount: OnMount = (editor) => {
    setEditor(editor);
    setCursorPosition(editor.getPosition());
    
    editor.onDidChangeCursorPosition(e => {
        setCursorPosition(e.position);
    });

    editor.addCommand(
        2097, // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
        () => immediateSave(editor.getValue())
    );

    editor.focus();
  };


  const languageConfig = getLanguageConfigFromFilename(file.name);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex-1">
        <Editor
          height="100%"
          path={file.name}
          defaultLanguage={languageConfig.monacoLanguage}
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={content}
          onChange={handleEditorChange}
          options={EDITOR_CONFIG}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
