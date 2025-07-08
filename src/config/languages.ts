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
    judge0Id: 93,
    runner: "node",
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    monacoLanguage: "typescript",
    judge0Id: 94,
    runner: "node",
  },
  python: {
    name: "Python",
    extensions: [".py"],
    monacoLanguage: "python",
    judge0Id: 71,
    runner: "python",
  },
  java: {
    name: "Java",
    extensions: [".java"],
    monacoLanguage: "java",
    judge0Id: 62,
    runner: "run-java",
  },
  c: {
    name: "C",
    extensions: [".c"],
    monacoLanguage: "c",
    judge0Id: 52,
    runner: "run-c",
  },
  cpp: {
    name: "C++",
    extensions: [".cpp", ".cxx"],
    monacoLanguage: "cpp",
    judge0Id: 54,
    runner: "run-cpp",
  },
  csharp: {
    name: "C#",
    extensions: [".cs"],
    monacoLanguage: "csharp",
    judge0Id: 51,
  },
  go: {
    name: "Go",
    extensions: [".go"],
    monacoLanguage: "go",
    judge0Id: 60,
  },
  php: {
    name: "PHP",
    extensions: [".php"],
    monacoLanguage: "php",
    judge0Id: 70,
  },
  ruby: {
    name: "Ruby",
    extensions: [".rb"],
    monacoLanguage: "ruby",
    judge0Id: 72,
  },
  rust: {
    name: "Rust",
    extensions: [".rs"],
    monacoLanguage: "rust",
    judge0Id: 73,
  },
  html: {
    name: "HTML",
    extensions: [".html"],
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
    extensions: [".txt"],
    monacoLanguage: "plaintext",
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
