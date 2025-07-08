import type * as monaco from 'monaco-editor';

export const getSnippets = (language: string): monaco.languages.CompletionItem[] => {
    const defaultSnippets: monaco.languages.CompletionItem[] = [
        {
            label: 'clg',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'console.log($1);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'console.log()',
            range: undefined as any,
        }
    ];

    switch(language) {
        case 'javascript':
        case 'typescript':
            return [
                ...defaultSnippets,
                {
                    label: 'imp',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'import ${1:module} from \'${2:source}\';',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Import module',
                    range: undefined as any,
                },
                {
                    label: 'fun',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Function declaration',
                    range: undefined as any,
                },
            ];
        default:
            return [];
    }
}
