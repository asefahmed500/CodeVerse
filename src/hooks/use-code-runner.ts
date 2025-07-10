
import { useFileSystem } from '@/hooks/use-file-system';
import { useTerminalStore } from '@/hooks/use-terminal-store';
import { useActiveView } from '@/hooks/use-active-view';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { toast } from 'sonner';
import { executeCode } from '@/lib/code-runner';
import { useTerminalManager } from './use-terminal-manager-store';
import { useProblemsStore } from './use-problems-store';
import type { Problem } from '@/types';

export function useCodeRunner() {
  const { appendOutput } = useTerminalStore();
  const { openView } = useActiveView();
  const { setActiveTerminalId, terminals } = useTerminalManager();

  const runActiveFile = async () => {
    // This is the critical change: get the state directly here
    // to ensure it's the most up-to-date version.
    const activeFileId = useFileSystem.getState().activeFileId;
    const activeFile = activeFileId ? useFileSystem.getState().findFile(activeFileId) : null;
    
    if (!activeFile || activeFile.isFolder) {
        toast.error("No runnable file selected.");
        return;
    }
    
    const { setProblems, clearProblems } = useProblemsStore.getState();
    clearProblems();
    
    const languageConfig = getLanguageConfigFromFilename(activeFile.name);

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

    // Ensure the terminal panel is visible and active
    if(terminals.length > 0) setActiveTerminalId(terminals[0]._id);
    openView('terminal');
    
    const toastId = toast.loading(`Executing ${activeFile.name}...`);
    
    const result = await executeCode(activeFile.content, languageConfig.judge0Id);
    
    const outputLines = [];
    const newProblems: Problem[] = [];
    outputLines.push(`\r\n\x1b[1;34m> Executing ${activeFile.name}...\x1b[0m`);

    const processAndAddProblem = (message: string) => {
        const errorRegex = /(?:[a-zA-Z]:\\)?(?:[a-zA-Z0-9\s_.-]+\/)*[a-zA-Z0-9_.-]+:(\d+):(?:\d+:\s)?(.*)/;
        const match = message.match(errorRegex);
        if (match) {
            newProblems.push({
                fileId: activeFile._id,
                lineNumber: parseInt(match[1], 10),
                message: match[2].trim(),
            });
        } else {
             newProblems.push({ fileId: activeFile._id, message });
        }
    }

    if (result.compileError) {
        outputLines.push(`\r\n\x1b[1;31mCompilation Error:\x1b[0m`);
        const compileErrors = result.compileError.split('\n');
        outputLines.push(...compileErrors.map(l => `\r\x1b[31m${l}\x1b[0m`));
        compileErrors.forEach(processAndAddProblem);
    }
    
    if (result.logs.length > 0) {
        outputLines.push(`\r\n\x1b[1;32mOutput (stdout):\x1b[0m`);
        outputLines.push(...result.logs.map(l => `\r${l}`));
    }
    
    if (result.errorLogs.length > 0) {
        outputLines.push(`\r\n\x1b[1;31mError Output (stderr):\x1b[0m`);
        outputLines.push(...result.errorLogs.map(l => `\r\x1b[31m${l}\x1b[0m`));
        result.errorLogs.forEach(processAndAddProblem);
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
    
    setProblems(newProblems);
    if (newProblems.length > 0) {
        openView('problems');
    }

    appendOutput(outputLines.join(''));
  }

  return { runActiveFile };
}

    