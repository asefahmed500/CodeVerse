import { useFileSystem } from '@/hooks/use-file-system';
import { useTerminalStore } from '@/hooks/use-terminal-store';
import { useActiveView } from '@/hooks/use-active-view';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { toast } from 'sonner';
import { executeCode } from '@/lib/code-runner';

export function useCodeRunner() {
  const { activeFileId, findFile } = useFileSystem();
  const { appendOutput } = useTerminalStore();
  const { openView } = useActiveView();

  const runActiveFile = async () => {
    const activeFile = findFile(activeFileId || '');
    if (!activeFile || activeFile.isFolder) {
        toast.error("No runnable file selected.");
        return;
    }
    
    const languageConfig = getLanguageConfigFromFilename(activeFile.name);

    // Special case for HTML files: open in a new tab for live preview
    if (languageConfig.monacoLanguage === 'html') {
        try {
            const blob = new Blob([activeFile.content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success(`Launched preview for ${activeFile.name}`);
        } catch (e) {
            toast.error("Could not create a preview for this HTML file.")
        }
        return;
    }
      
    if (!languageConfig.judge0Id) {
        toast.error(`'${languageConfig.name}' files cannot be run or executed.`);
        return;
    }

    openView('terminal');
    const toastId = toast.loading(`Executing ${activeFile.name}...`);
    
    const result = await executeCode(activeFile.content, languageConfig.judge0Id);
    
    const outputLines = [];
    outputLines.push(`\r\n\x1b[1;34m> Executing ${activeFile.name}...\x1b[0m`);

    if (result.compileError) {
        outputLines.push(`\r\n\x1b[1;31mCompilation Error:\x1b[0m`);
        outputLines.push(...result.compileError.split('\n').map(l => `\r\x1b[31m${l}\x1b[0m`));
    }
    
    if(result.logs.length > 0) {
        outputLines.push(...result.logs.map(l => `\r${l}`));
    }
    
    if(result.errorLogs.length > 0) {
        outputLines.push(...result.errorLogs.map(l => `\r\x1b[31m${l}\x1b[0m`));
    }

    if (result.executionError) {
        outputLines.push(`\r\n\x1b[1;31mRuntime Error: ${result.executionError}\x1b[0m`);
    }

    if (result.hasError) {
        toast.error(`Execution failed for ${activeFile.name}.`, { id: toastId });
        outputLines.push(`\r\n\x1b[33mExecution finished with errors.\x1b[0m`);
    } else {
        toast.success(`Executed ${activeFile.name} successfully.`, { id: toastId });
        outputLines.push(`\r\n\x1b[32mExecution finished successfully.\x1b[0m`);
    }

    appendOutput(outputLines.join(''));
  }

  return { runActiveFile };
}
