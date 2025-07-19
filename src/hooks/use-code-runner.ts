
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

    if(terminals.length > 0 && terminals[0]) {
      setActiveTerminalId(terminals[0]._id);
    }
    openView('terminal');
    
    const toastId = toast.loading(`Executing ${activeFile.name}...`);
    
    const result = await executeCode(activeFile.content, languageConfig.judge0Id, activeFile.name);
    
    const outputLines: string[] = [];
    const newProblems: Problem[] = [];

    const processAndAddProblem = (message: string) => {
        const cleanMessage = message.replace(/^.*error:\s*/, '').trim();
        const finalMessage = cleanMessage.split('\n')[0]; 
        newProblems.push({ fileId: activeFile._id, message: finalMessage });
    }
    
    outputLines.push('\r\n');

    if (result.compileError) {
        outputLines.push(`\x1b[1;31mCompilation Error:\x1b[0m\r\n`);
        const compileErrors = result.compileError.split('\n').filter(line => line.trim() !== '');
        outputLines.push(...compileErrors.map(l => `\x1b[31m${l}\x1b[0m`));
        compileErrors.forEach(processAndAddProblem);
    }
    
    if (result.logs.length > 0 && result.logs.join('').trim()) {
        outputLines.push(...result.logs);
    }
    
    if (result.errorLogs.length > 0 && result.errorLogs.join('').trim()) {
         result.errorLogs.forEach(errLine => {
            if (errLine.trim()) {
                outputLines.push(`\x1b[31m${errLine}\x1b[0m`);
                processAndAddProblem(errLine);
            }
        });
    }

    if (result.executionError) {
        outputLines.push(`\r\n\x1b[1;31mRuntime Error: ${result.executionError}\x1b[0m`);
    }

    if (result.hasError) {
        toast.error(`Execution failed for ${activeFile.name}.`, { id: toastId });
    } else {
        toast.success(`Executed ${activeFile.name} successfully.`, { id: toastId });
    }
    
    setProblems(newProblems);
    if (newProblems.length > 0) {
        openView('problems');
    }
    appendOutput(outputLines.join('\r\n'));
  }

  return { runActiveFile };
}
