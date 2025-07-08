export const LANGUAGE_CONFIG: Record<string, { name: string; extensions: string[]; monacoLanguage: string; }> = {
  javascript: {
    name: "JavaScript",
    extensions: [".js", ".jsx"],
    monacoLanguage: "javascript",
  },
  typescript: {
    name: "TypeScript",
    extensions: [".ts", ".tsx"],
    monacoLanguage: "typescript",
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

export const getLanguageFromFilename = (filename: string) => {
  if(!filename) return "plaintext";
  const extension = "." + filename.split(".").pop()?.toLowerCase();
  for (const lang of Object.values(LANGUAGE_CONFIG)) {
    if (lang.extensions.includes(extension)) {
      return lang.monacoLanguage;
    }
  }
  return "plaintext";
};
