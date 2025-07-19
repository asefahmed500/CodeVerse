export const IDE_MANUAL = `CODEVERSE IDE - FEATURE MANUAL
===============================

This document explains the core features of the CodeVerse IDE and how they work. It will be updated as new features are added.

---

1. FILE SYSTEM & EXPLORER
-------------------------
This feature allows you to manage your project's structure directly in the browser.

### Creating Files & Folders:
- **Using Header Icons:** In the "Explorer" view, use the "New File" or "New Folder" icons at the top to create an item in the root of your workspace.
- **Using Context Menu:** Right-click on a folder to create a new file or folder inside it.

### Managing Files & Folders:
It's all done by right-clicking on the file or folder you want to manage in the "Explorer" panel.

- **Right-Click an Item:** A context menu will appear with several options.
- **To Rename:** Select "Rename". The item's name will become an editable field. Type the new name and press Enter.
- **To Delete:** Select "Delete". Your file and all its contents (if it's a folder) will be permanently removed from your account.
- **To Duplicate:** Select "Duplicate". This will create a copy of the selected file or folder in the same directory.

### How it Works (Under the Hood):
The process is designed to be safe, reliable, and persistent across devices.

1.  **UI Interaction:** You interact with the \`Explorer\` component. When you perform an action like creating or deleting a file, the UI calls a function in the central file system state manager.
2.  **State Management & API Request:** The state manager (\`useFileSystem\` hook) immediately updates the UI for a responsive feel. Simultaneously, it sends a secure request to the backend API (e.g., a \`POST\` request to \`/api/files\` to create a file).
3.  **Secure Backend & Database:** The Next.js API route receives the request. It validates the action and then performs the operation (create, update, delete) on the central MongoDB database. Your files are tied to your user account.
4.  **Persistence Across Devices:** Because your workspace is stored in a central database, you can log in from any device and access your complete file system. To start fresh, you can use the "Reset Workspace" button in the Settings panel.

---

2. CODE EDITOR
--------------
- The central panel is a feature-rich code editor powered by Monaco (the same editor used in VS Code).
- **Syntax Highlighting:** Automatically detects the language based on the file extension and applies appropriate color schemes.
- **Keybindings:** Supports standard keybindings like Ctrl+S to save.
- **Breakpoints:** Click in the gutter to the left of the line numbers to set or remove a breakpoint (red dot). These are used by the debugger.
- **Snippets:** Common boilerplate code can be inserted using snippets for all major programming languages. For example, in a JavaScript file, type 'clg' and press Tab to expand it to 'console.log();', or in a Python file, type 'def' to create a new function.

---

3. CODE EXECUTION & DEBUGGING
-----------------------------
The IDE uses a powerful backend service (Judge0) to compile and run your code securely in a sandboxed environment.

- **How to Run:** Open any supported file (e.g., Python, Java, C++, JavaScript) and click the "Play" button in the header or use the Command Palette. The code is sent to the execution service, and any output, including compilation errors or standard output/error, will appear in the "Terminal" tab.
- **Supported Languages:** C, C++, C#, Go, Java, JavaScript, PHP, Python, Ruby, Rust, and TypeScript are all executable.
- **Live Preview (HTML):** Running an \`.html\` file will open it in a new browser tab for a live preview. This is a local browser action and does not involve the execution service.
- **Setup:** For this feature to work, a valid Judge0 API key must be provided in the \`.env\` file. See `README.md` for details.
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

- **Authentication:** To use GitHub features, you must first sign in with your GitHub account.
- **Cloning a Repository:**
  1. Open the Source Control panel (git branch icon).
  2. If your workspace is empty, you will see an input field.
  3. Paste the full URL of any public GitHub repository (e.g., \`https://github.com/owner/repo\`).
  4. Click "Clone". The IDE will fetch the project's text-based files and load them into the file explorer.
- **Pushing & Pulling Changes:**
  - Modified files appear in the "Changes" list in the Source Control panel.
  - Check the box next to the files you want to include in your commit.
  - Write a commit message and click "Commit & Push" to save your changes to your GitHub repository.
  - Use "Pull Changes" to update your workspace with the latest version from GitHub.

---

5. COMMAND PALETTE
------------------
- **Access:** Press \`Ctrl+Shift+P\` (or \`Cmd+Shift+P\` on Mac).
- **Functionality:** This provides a quick, searchable interface to access almost every command in the IDE, from creating a new file to toggling the theme.

---

6. SEARCH & REPLACE
-------------------
- **Access:** Click the "Search" icon in the Activity Bar or press \`Ctrl+Shift+F\`.
- **Functionality:**
    - Enter a term in the search box to find all occurrences across all files in your project.
    - Results are displayed in an expandable tree view. Click any result to jump to that line in the editor.
    - To replace text, toggle the replace input, enter your new text, and click the "Replace All" icon.
`
