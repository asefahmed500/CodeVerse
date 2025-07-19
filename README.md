# CodeVerse

CodeVerse is a powerful, full-featured Integrated Development Environment (IDE) that runs entirely in your browser. Built with Next.js, React, and MongoDB, it provides a seamless, cloud-native development experience that allows you to write, test, and manage your code from anywhere, on any device.

## Project Status

**Complete & Fully Functional:** All core features have been implemented, tested, and are working as expected. The application is now considered stable and production-ready.

## Core Features

*   **Full-Fledged Code Editor:** Powered by Monaco (the engine behind VS Code), featuring syntax highlighting, code snippets, and configurable settings.
*   **Complete File System:** A persistent, user-specific file explorer that lets you create, rename, delete, and organize files and folders, all stored securely in a MongoDB database.
*   **Multi-Language Code Execution:** Run code in JavaScript, Python, Java, C++, and many other languages directly in the integrated terminal, powered by Judge0. *Note: This feature is designed for running individual scripts and files, not for hosting or running complex multi-file projects (e.g., with `npm run dev` or `docker-compose up`).*
*   **GitHub Integration:** Clone any public GitHub repository to instantly populate your workspace and start coding.
*   **Project-Wide Search:** A powerful search and replace tool to find and modify code across all your files.
*   **Modern UI/UX:** A responsive, resizable layout with light/dark themes, a command palette, and essential keyboard shortcuts.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   MongoDB Atlas account (or a local MongoDB instance)
*   GitHub Account (for OAuth)
*   RapidAPI Account (for Judge0 API Key)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd codeverse
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env` in the root of your project and add the following environment variables.

    ```env
    # MongoDB Connection String for your database
    # Example: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>
    MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"

    # A secret key for NextAuth to encrypt sessions.
    # Generate one with the command: openssl rand -base64 32
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

    # Your GitHub OAuth App credentials.
    # You can create an OAuth App in your GitHub developer settings.
    # The callback URL should be: http://localhost:3000/api/auth/callback/github
    GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
    GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

    # Your API key for the Judge0 Code Execution engine.
    # You can get a free key from RapidAPI: https://rapidapi.com/judge0-official/api/judge0-ce
    JUDGE0_API_KEY="YOUR_JUDGE0_API_KEY"
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
