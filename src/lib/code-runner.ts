
export interface ExecutionResult {
    logs: string[];
    errorLogs: string[];
    compileError: string | null;
    executionError: string | null;
    hasError: boolean;
}

export const executeCode = async (
    code: string, 
    languageId: number,
    filename?: string,
): Promise<ExecutionResult> => {
    try {
        const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                filename: filename,
            }),
        });
        
        const result = await response.json();

        if (!response.ok) {
            return { 
                logs: [], 
                errorLogs: [result.error || `Request failed with status ${response.status}`],
                compileError: null,
                executionError: `Server responded with status ${response.status}`,
                hasError: true
            };
        }
        
        const logs = result.stdout ? result.stdout.trim().split('\n') : [];
        const errorLogs = result.stderr ? result.stderr.trim().split('\n').filter(Boolean) : [];
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
            errorLogs: [`An unexpected client-side error occurred: ${e.message}`],
            compileError: null,
            executionError: `Client-side error: ${e.message}`,
            hasError: true
        };
    }
};
