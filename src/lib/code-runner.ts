export const executeCode = async (
    code: string, 
    languageId: number
): Promise<{ logs: string[]; error: string | null }> => {
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
            return { logs: [], error: errorData.error || `Request failed with status ${response.status}` };
        }

        const result = await response.json();
        
        let logs: string[] = [];
        let error: string | null = null;
        
        if (result.stdout) {
            logs = result.stdout.split('\n').filter((l: string) => l.trim() !== '');
        }

        if (result.stderr) {
            error = result.stderr;
        } else if (result.compile_output) {
            error = result.compile_output;
        } else if (result.status.description !== 'Accepted') {
            error = result.status.description;
        }

        return { logs, error };

    } catch (e: any) {
        return { logs: [], error: `An unexpected network error occurred: ${e.message}` };
    }
};
