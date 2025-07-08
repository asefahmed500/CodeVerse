export const IDE_MANUAL = `AETHERMIND IDE - FEATURE MANUAL
===============================

This document explains the core features of the Aethermind IDE and how they work. It will be updated as new features are added.

---

1. FILE SYSTEM & EXPLORER
-------------------------
- The file explorer on the left allows you to create, rename, and delete files and folders.
- All your files are saved in your browser's local storage. This means your workspace is persistent on your machine, but not accessible from other devices.
- To start fresh, you can use the "Reset Workspace" button in the Settings panel.

---

2. CODE EDITOR
--------------
- The central panel is a feature-rich code editor powered by Monaco (the same editor used in VS Code).
- **Syntax Highlighting:** Automatically detects the language based on the file extension and applies appropriate color schemes.
- **Keybindings:** Supports standard keybindings and Vim mode. You can switch between them in the Settings panel.
- **Breakpoints:** Click in the gutter to the left of the line numbers to set or remove a breakpoint (red dot). These are used by the debugger.
- **Snippets:** Common boilerplate code can be inserted using snippets. For example, in a JavaScript file, type \`clg\` and press Tab or Enter to expand it to \`console.log();\`.

---

3. CODE EXECUTION & DEBUGGING
-----------------------------
The IDE uses a powerful backend service (Judge0) to compile and run your code securely in a sandboxed environment.

- **How to Run:** Open any supported file (e.g., Python, Java, C++, JavaScript) and click the "Play" button in the header or use the Command Palette. The code is sent to the execution service, and any output, including compilation errors or standard output/error, will appear in the "Terminal" tab.
- **Supported Languages:** C, C++, C#, Go, Java, JavaScript, PHP, Python, Ruby, Rust, and TypeScript are all executable.
- **Live Preview (HTML):** Running an \`.html\` file will open it in a new browser tab for a live preview. This is a local browser action and does not involve the execution service.
- **Setup:** For this feature to work, a valid Judge0 API key must be provided in the \`.env\` file. See \`.env.example\` for details.
- **Debugging:** The debugging feature remains a *simulation*. It allows you to step through your code and inspect variables to understand the logic flow, but it does not perform a live debug of the remotely executed code.
  1. Set breakpoints in your code.
  2. Click the "Bug" icon to start a debug session.
  3. The debugger will pause at each breakpoint.
  4. Use the controls (Continue, Step Over, etc.) to navigate your code.
  5. The "Variables" view will show the *simulated* state of variables at the current line.

---

4. SOURCE CONTROL & GITHUB
--------------------------
The IDE is integrated with GitHub for source control and project management.

- **Authentication:** To use GitHub features, you must first sign in. Go to the Settings panel (cog icon) and connect your GitHub account. You will need to provide a GitHub OAuth App's Client ID and Secret in a \`.env\` file (see \`.env.example\`).
- **Cloning a Repository:**
  1. Open the Source Control panel (git branch icon).
  2. If your workspace is empty, you will see an input field.
  3. Paste the full URL of any public GitHub repository (e.g., \`https://github.com/owner/repo\`).
  4. Click "Clone Repository". The IDE will fetch the project's text-based files and load them into the file explorer.
- **Committing (Simulated):** The IDE *simulates* the Git commit process for demonstration.
  - Modified files appear in the "Changes" list in the Source Control panel.
  - Write a commit message and click "Commit" to mark the files as saved (clearing their "dirty" state).
  - **Note:** This is a simulation and does NOT push any changes to GitHub.

---

5. COMMAND PALETTE
------------------
- **Access:** Press \`Ctrl+Shift+P\` (or \`Cmd+Shift+P\` on Mac).
- **Functionality:** This provides a quick, searchable interface to access almost every command in the IDE, from running code to toggling the theme.

---

6. SEARCH & REPLACE
-------------------
- **Access:** Click the "Search" icon in the Activity Bar or press \`Ctrl+Shift+F\`.
- **Functionality:**
    - Enter a term in the search box to find all occurrences across all files in your project.
    - Results are displayed in an expandable tree view. Click any result to jump to that line in the editor.
    - Use the options to toggle case sensitivity, match whole words, or use regular expressions.
    - To replace text, toggle the replace input, enter your new text, and click "Replace All".
`;
