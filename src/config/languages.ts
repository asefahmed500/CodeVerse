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
    judge0Id: 93, // NodeJS
    runner: "node",
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    monacoLanguage: "typescript",
    judge0Id: 74,
    runner: "node",
  },
  python: {
    name: "Python",
    extensions: [".py"],
    monacoLanguage: "python",
    judge0Id: 71,
    runner: "python",
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
