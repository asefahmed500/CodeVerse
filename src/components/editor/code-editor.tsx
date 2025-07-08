"use client";

import Editor, { OnChange } from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";
import type { FileType } from "@/types";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { EDITOR_CONFIG } from "@/config/editor";
import { getLanguageConfigFromFilename } from "@/config/languages";
import { useFileSystem } from "@/hooks/use-file-system";
import { debounce } from "@/lib/utils";

export function CodeEditor({ file }: { file: FileType }) {
  const { theme } = useTheme();
  const [content, setContent] = useState(file.content);
  const [isSaving, setIsSaving] = useState(false);
  const { updateFile } = useFileSystem();

  useEffect(() => {
    setContent(file.content);
  }, [file.content]);

  const handleSave = useCallback(async (currentContent: string) => {
    setIsSaving(true);
    try {
      await updateFile(file._id, { content: currentContent });
      toast.success(`${file.name} saved.`);
    } catch (error) {
      toast.error(`Failed to save ${file.name}`);
    } finally {
      setIsSaving(false);
    }
  }, [file._id, file.name, updateFile]);

  const debouncedSave = useCallback(debounce(handleSave, 2000), [handleSave]);

  const handleEditorChange: OnChange = (value) => {
    const newContent = value || "";
    setContent(newContent);
    debouncedSave(newContent);
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
          onMount={(editor) => {
            editor.addCommand(
              2097, // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
              () => handleSave(editor.getValue())
            );
          }}
        />
      </div>
    </div>
  );
}
