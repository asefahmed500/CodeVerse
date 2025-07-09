
export interface ExecutionResult {
    logs: string[];
    errorLogs: string[];
    compileError: string | null;
    executionError: string | null;
    hasError: boolean;
}

export const executeCode = async (
    code: string, 
    languageId: number
): Promise<ExecutionResult> => {
    try {
        const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { 
                logs: [], 
                errorLogs: [],
                compileError: null,
                executionError: errorData.error || `Request failed with status ${response.status}`,
                hasError: true
            };
        }

        const result = await response.json();
        
        const logs = result.stdout ? result.stdout.split('\n').filter((l: string) => l.trim() !== '') : [];
        const errorLogs = result.stderr ? result.stderr.split('\n').filter((l: string) => l.trim() !== '') : [];
        const compileError = result.compile_output?.trim() || null;
        
        let executionError = null;
        if (result.status?.description && result.status.description !== 'Accepted') {
            executionError = result.status.description;
        }
        
        const hasError = errorLogs.length > 0 || !!compileError || !!executionError;

        return { logs, errorLogs, compileError, executionError, hasError };

    } catch (e: any) {
        return { 
            logs: [], 
            errorLogs: [],
            compileError: null,
            executionError: `An unexpected network error occurred: ${e.message}`,
            hasError: true
        };
    }
};
