export const EDITOR_CONFIG = {
  minimap: {
    enabled: true,
    showSlider: "always" as const,
    side: "right" as const,
  },
  scrollBeyondLastLine: false,
  fontSize: 14,
  fontFamily: "'Source Code Pro', 'Courier New', monospace",
  wordWrap: "on" as const,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  autoClosingBrackets: "always" as const,
  autoClosingQuotes: "always" as const,
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on" as const,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
};

export const DEFAULT_THEME = "vs-dark";
