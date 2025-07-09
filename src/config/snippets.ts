import type * as monaco from 'monaco-editor';

const createSnippet = (label: string, insertText: string, documentation: string): monaco.languages.CompletionItem => ({
    label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation,
    range: undefined as any,
});

export const getSnippets = (language: string): monaco.languages.CompletionItem[] => {
    const baseSnippets = [
        createSnippet('clg', 'console.log($1);', 'console.log()'),
    ];

    switch(language) {
        case 'javascript':
        case 'typescript':
            return [
                ...baseSnippets,
                createSnippet('imp', 'import ${1:module} from \'${2:source}\';', 'Import module'),
                createSnippet('exp', 'export { ${1:name} };', 'Export module'),
                createSnippet('fun', 'function ${1:name}(${2:params}) {\n\t$0\n}', 'Function declaration'),
                createSnippet('arrow', 'const ${1:name} = (${2:params}) => {\n\t$0\n};', 'Arrow function'),
                createSnippet('for', 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\tconst ${3:element} = ${2:array}[${1:i}];\n\t$0\n}', 'For loop'),
                createSnippet('ife', 'if (${1:condition}) {\n\t$0\n} else {\n\t\n}', 'If/else statement'),
            ];

        case 'python':
            return [
                createSnippet('imp', 'import ${1:module}', 'Import module'),
                createSnippet('def', 'def ${1:name}(${2:params}):\n\t$0', 'Function definition'),
                createSnippet('cl', 'class ${1:Name}:\n\tdef __init__(self, ${2:params}):\n\t\t$0', 'Class definition'),
                createSnippet('for', 'for ${1:item} in ${2:iterable}:\n\t$0', 'For loop'),
                createSnippet('if', 'if ${1:condition}:\n\t$0', 'If statement'),
                createSnippet('ife', 'if ${1:condition}:\n\t$0\nelse:\n\t', 'If/else statement'),
            ];

        case 'java':
            return [
                createSnippet('main', 'public static void main(String[] args) {\n\t$0\n}', 'Main method'),
                createSnippet('sout', 'System.out.println(${1});', 'System.out.println()'),
                createSnippet('cl', 'public class ${1:Name} {\n\t$0\n}', 'Class definition'),
                createSnippet('for', 'for (int i = 0; i < ${1:size}; i++) {\n\t$0\n}', 'For loop'),
            ];
            
        case 'c':
             return [
                createSnippet('main', 'int main(int argc, char const *argv[])\n{\n\t$0\n\treturn 0;\n}', 'Main function'),
                createSnippet('pr', 'printf("${1:%s}\\n", ${2:value});', 'printf()'),
                createSnippet('for', 'for (int i = 0; i < ${1:count}; ++i)\n{\n\t$0\n}', 'For loop'),
                createSnippet('inc', '#include <${1:stdio.h}>', 'Include directive'),
             ];

        case 'cpp':
            return [
                createSnippet('main', 'int main(int argc, char const *argv[])\n{\n\t$0\n\treturn 0;\n}', 'Main function'),
                createSnippet('cout', 'std::cout << ${1:value} << std::endl;', 'std::cout'),
                createSnippet('for', 'for (int i = 0; i < ${1:count}; ++i)\n{\n\t$0\n}', 'For loop'),
                createSnippet('cl', 'class ${1:Name} {\npublic:\n\t${1:Name}();\n\t~$1();\n\nprivate:\n\t$0\n};', 'Class definition'),
                createSnippet('inc', '#include <${1:iostream}>', 'Include directive'),
            ];

        case 'csharp':
            return [
                createSnippet('main', 'public static void Main(string[] args)\n{\n\t$0\n}', 'Main method'),
                createSnippet('cw', 'Console.WriteLine(${1});', 'Console.WriteLine()'),
                createSnippet('cl', 'public class ${1:Name}\n{\n\t$0\n}', 'Class definition'),
                createSnippet('prop', 'public ${1:string} ${2:MyProperty} { get; set; }', 'Auto-property'),
            ];
            
        case 'go':
            return [
                createSnippet('main', 'func main() {\n\t$0\n}', 'Main function'),
                createSnippet('fmtp', 'fmt.Println(${1})', 'fmt.Println()'),
                createSnippet('fun', 'func ${1:name}(${2}) ${3:error} {\n\t$0\n}', 'Function definition'),
                createSnippet('for', 'for i := 0; i < ${1:count}; i++ {\n\t$0\n}', 'For loop'),
            ];

        case 'php':
            return [
                createSnippet('eco', 'echo "${1:Hello World}";', 'Echo statement'),
                createSnippet('fun', 'function ${1:name}(${2}) {\n\t$0\n}', 'Function definition'),
                createSnippet('cl', 'class ${1:Name}\n{\n\tpublic function __construct()\n\t{\n\t\t$0\n\t}\n}', 'Class definition'),
            ];

        case 'ruby':
             return [
                createSnippet('def', 'def ${1:method_name}\n\t$0\nend', 'Method definition'),
                createSnippet('cl', 'class ${1:Name}\n\tdef initialize\n\t\t$0\n\tend\nend', 'Class definition'),
                createSnippet('put', 'puts "${1:Hello}"', 'Puts statement'),
                createSnippet('req', 'require \'${1:gem}\'', 'Require gem'),
             ];

        case 'rust':
            return [
                createSnippet('main', 'fn main() {\n\t$0\n}', 'Main function'),
                createSnippet('prl', 'println!("${1}");', 'println! macro'),
                createSnippet('fn', 'fn ${1:name}(${2}) -> ${3:T} {\n\t$0\n}', 'Function definition'),
                createSnippet('st', 'struct ${1:Name} {\n\t$0\n}', 'Struct definition'),
            ];

        default:
            return [];
    }
}
