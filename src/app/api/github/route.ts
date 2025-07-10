
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Octokit } from "octokit";

// A more robust list of text file extensions and known config filenames
const textFileExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.less', '.html', '.htm', 
    '.md', '.txt', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', 
    '.php', '.rb', '.rs', '.sh', '.yml', '.yaml', '.xml', '.toml', '.ini',
    '.env', 'LICENSE', 'README', 'Makefile', 'Dockerfile', 'Procfile', '.gitignore',
    '.npmrc', '.nvmrc', 'webpack.config.js', 'babel.config.js', 'postcss.config.js'
];

const knownFilenames = [
    '.babelrc', '.eslintrc', '.prettierrc', 'package.json', 'tsconfig.json', 'gemfile', 'rakefile', 'poetry.lock', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'
];

const isTextFile = (fileName: string) => {
    const lowerFileName = fileName.toLowerCase();
    if (knownFilenames.some(known => lowerFileName.endsWith(known))) return true;
    return textFileExtensions.some(ext => lowerFileName.endsWith(ext));
};

async function fetchRepoContents(octokit: Octokit, owner: string, repo: string, path: string = ''): Promise<{ path: string, content?: string, type: 'file' | 'dir' }[]> {
    try {
        const response = await octokit.rest.repos.getContent({ owner, repo, path });
        const contents = response.data;

        if (!Array.isArray(contents)) {
            // This case handles getting a single file's content directly
            if (contents.type === 'file' && contents.content && isTextFile(contents.name)) {
                return [{ 
                    path: contents.path, 
                    content: Buffer.from(contents.content, 'base64').toString('utf-8'),
                    type: 'file'
                }];
            }
            return []; // Ignore single binary files
        }

        const items: { path: string, content?: string, type: 'file' | 'dir' }[] = [];
        for (const item of contents) {
            if (item.type === 'dir') {
                items.push({ path: item.path, type: 'dir' });
                const subItems = await fetchRepoContents(octokit, owner, repo, item.path);
                items.push(...subItems);
            } else if (item.type === 'file' && item.download_url && isTextFile(item.name)) {
                 try {
                    // Only fetch content for reasonably sized text files to avoid memory issues
                    if (item.size < 1000000) { // 1MB limit per file
                        const fileResponse = await fetch(item.download_url);
                        if(fileResponse.ok) {
                            const content = await fileResponse.text();
                            items.push({ path: item.path, content, type: 'file' });
                        }
                    } else {
                        console.warn(`Skipping large file: ${item.path}`);
                    }
                } catch (e) {
                    console.warn(`Skipping file ${item.path} due to fetch error.`);
                }
            }
        }
        return items;
    } catch (error: any) {
        if (error.status === 404) {
            console.warn(`Path not found during GitHub clone: ${path}. Skipping.`);
            return [];
        }
        throw error; // Re-throw other errors to be main handler
    }
}


export async function GET(request: Request) {
  const session = await auth();

  if (!(session?.user as any)?.accessToken) {
    return NextResponse.json({ error: "GitHub account not connected or unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const octokit = new Octokit({ auth: (session?.user as any).accessToken });

  try {
    switch (action) {
      case "getUser":
        const user = await octokit.rest.users.getAuthenticated();
        return NextResponse.json(user.data);
      
      case "getRepoTree":
        const owner = searchParams.get("owner");
        const repo = searchParams.get("repo");
        if (!owner || !repo) {
            return NextResponse.json({ error: "Missing repository owner or name" }, { status: 400 });
        }
        const items = await fetchRepoContents(octokit, owner, repo);
        const mappedItems = items.map(item => ({
            path: item.path,
            content: item.content,
            isFolder: item.type === 'dir'
        }));
        return NextResponse.json(mappedItems);

      default:
        return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("GitHub API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred with the GitHub API" },
      { status: error.status || 500 }
    );
  }
}
