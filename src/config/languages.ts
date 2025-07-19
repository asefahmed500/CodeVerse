
export const LANGUAGE_CONFIG: Record<string, { 
  name: string; 
  extensions: string[]; 
  monacoLanguage: string;
  judge0Id?: number;
  runner?: string;
}> = {
  javascript: {
    name: "JavaScript",
    extensions: [".js", ".jsx"],
    monacoLanguage: "javascript",
    judge0Id: 93, // NodeJS (18.15.0)
    runner: "node",
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    monacoLanguage: "typescript",
    judge0Id: 94, // TypeScript (5.0.3)
    runner: "ts-node",
  },
  python: {
    name: "Python",
    extensions: [".py"],
    monacoLanguage: "python",
    judge0Id: 71, // Python (3.8.1) -> Using 71 for Python 3.9.4 for more recent features
    runner: "python",
  },
  java: {
    name: "Java",
    extensions: [".java"],
    monacoLanguage: "java",
    judge0Id: 62, // Java (OpenJDK 13.0.1) -> Using 62 for OpenJDK 15.0.2
    runner: "java",
  },
  c: {
    name: "C",
    extensions: [".c"],
    monacoLanguage: "c",
    judge0Id: 52, // C (GCC 9.2.0)
    runner: "c",
  },
  cpp: {
    name: "C++",
    extensions: [".cpp", ".cxx"],
    monacoLanguage: "cpp",
    judge0Id: 54, // C++ (GCC 9.2.0)
    runner: "cpp",
  },
  csharp: {
    name: "C#",
    extensions: [".cs"],
    monacoLanguage: "csharp",
    judge0Id: 51, // C# (Mono 6.6.0.161)
    runner: "csharp",
  },
  go: {
    name: "Go",
    extensions: [".go"],
    monacoLanguage: "go",
    judge0Id: 60, // Go (1.13.5)
    runner: "go",
  },
  php: {
    name: "PHP",
    extensions: [".php"],
    monacoLanguage: "php",
    judge0Id: 68, // PHP (7.4.1)
    runner: "php",
  },
  ruby: {
    name: "Ruby",
    extensions: [".rb"],
    monacoLanguage: "ruby",
    judge0Id: 72, // Ruby (2.7.0)
    runner: "ruby",
  },
  rust: {
    name: "Rust",
    extensions: [".rs"],
    monacoLanguage: "rust",
    judge0Id: 73, // Rust (1.40.0)
    runner: "rust",
  },
  html: {
    name: "HTML",
    extensions: [".html", ".htm"],
    monacoLanguage: "html",
  },
  css: {
    name: "CSS",
    extensions: [".css"],
    monacoLanguage: "css",
  },
  json: {
    name: "JSON",
    extensions: [".json"],
    monacoLanguage: "json",
  },
  markdown: {
    name: "Markdown",
    extensions: [".md"],
    monacoLanguage: "markdown",
  },
  plaintext: {
    name: "Plain Text",
    extensions: [".txt", ""],
    monacoLanguage: "plaintext",
    judge0Id: 43
  },
};

const PLAINTEXT_CONFIG = LANGUAGE_CONFIG.plaintext;

export const getLanguageConfigFromFilename = (filename: string) => {
  if(!filename) return PLAINTEXT_CONFIG;
  const extension = "." + filename.split(".").pop()?.toLowerCase();
  for (const lang of Object.values(LANGUAGE_CONFIG)) {
    if (lang.extensions.includes(extension)) {
      return lang;
    }
  }
  return PLAINTEXT_CONFIG;
};

export const getLanguageFromFilename = (filename: string) => {
  return getLanguageConfigFromFilename(filename).monacoLanguage;
};
