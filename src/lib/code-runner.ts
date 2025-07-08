export const runJsCode = (code: string): Promise<{logs: string[], error: string | null}> => {
    return new Promise((resolve) => {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        let timeoutId: any;

        const cleanup = () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            clearTimeout(timeoutId);
        };

        const fakeConsole = {
            log: (...args: any[]) => {
                logs.push(args.map(a => {
                    try {
                        return JSON.stringify(a, null, 2);
                    } catch {
                        return String(a);
                    }
                }).join(' '));
            },
            error: (...args: any[]) => {
                logs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`);
            },
            warn: (...args: any[]) => {
                logs.push(`WARN: ${args.map(a => String(a)).join(' ')}`);
            },
        };

        timeoutId = setTimeout(() => {
            cleanup();
            resolve({ logs, error: "Execution timed out after 5 seconds" });
        }, 5000);

        try {
            console.log = fakeConsole.log;
            console.error = fakeConsole.error;
            console.warn = fakeConsole.warn;
            
            // Using Function constructor is safer than eval
            const runner = new Function('console', code);
            runner(fakeConsole);
            cleanup();
            resolve({ logs, error: null });
        } catch (e: any) {
            cleanup();
            resolve({ logs, error: e.message });
        }
    });
};
