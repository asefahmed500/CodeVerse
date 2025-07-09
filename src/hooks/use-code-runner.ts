import { useFileSystem } from '@/hooks/use-file-system';
import { useTerminalStore } from '@/hooks/use-terminal-store';
import { useActiveView } from '@/hooks/use-active-view';
import { getLanguageConfigFromFilename } from '@/config/languages';
import { toast } from 'sonner';

export function useCodeRunner() {
  const { activeFileId, findFile, getPathForFile } = useFileSystem();
  const { runCommand } = useTerminalStore();
  const { openView } = useActiveView();

  const runActiveFile = () => {
    const activeFile = findFile(activeFileId || '');
    if (!activeFile || activeFile.isFolder) {
        toast.error("No runnable file selected.");
        return;
    }
    
    const languageConfig = getLanguageConfigFromFilename(activeFile.name);

    // Special case for HTML files: open in a new tab for live preview
    if (languageConfig.monacoLanguage === 'html') {
        const blob = new Blob([activeFile.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success(`Launched preview for ${activeFile.name}`);
        return;
    }
      
    // Check if the language is executable
    if (!languageConfig.judge0Id) {
        toast.error(`'${languageConfig.name}' files cannot be run or executed.`);
        return;
    }

    const path = getPathForFile(activeFile._id);
    if (path) {
        openView('terminal');
        const command = languageConfig.runner || 'node'; // Default to node if runner isn't specified
        runCommand(`${command} ${path}`);
    } else {
        toast.error("Could not determine the file path to run the code.");
    }
  }

  return { runActiveFile };
}
