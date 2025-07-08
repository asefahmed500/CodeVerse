import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Octokit } from "octokit";

const textFileExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.htm', 
    '.md', '.txt', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', 
    '.php', '.rb', '.rs', '.sh', '.yml', '.yaml', '.xml', '.toml', '.ini',
    '.env', '.babelrc', '.eslintrc', '.prettierrc', 'package.json', 'tsconfig.json'
];

async function fetchRepoContents(octokit: Octokit, owner: string, repo: string, path: string = ''): Promise<{ path: string, content?: string, type: 'file' | 'dir' }[]> {
    try {
        const response = await octokit.rest.repos.getContent({ owner, repo, path });
        const contents = response.data;

        if (!Array.isArray(contents)) {
            if (contents.type === 'file' && contents.content) {
                return [{ 
                    path: contents.path, 
                    content: Buffer.from(contents.content, 'base64').toString('utf-8'),
                    type: 'file'
                }];
            }
            return [];
        }

        const items: { path: string, content?: string, type: 'file' | 'dir' }[] = [];
        for (const item of contents) {
            if (item.type === 'dir') {
                items.push({ path: item.path, type: 'dir' });
                const subItems = await fetchRepoContents(octokit, owner, repo, item.path);
                items.push(...subItems);
            } else if (item.type === 'file' && item.download_url && textFileExtensions.some(ext => item.name.endsWith(ext) || item.name.toLowerCase().includes(ext.slice(1)))) {
                 try {
                    const fileResponse = await fetch(item.download_url);
                    if(fileResponse.ok) {
                        const content = await fileResponse.text();
                        items.push({ path: item.path, content, type: 'file' });
                    }
                } catch (e) {
                    console.warn(`Skipping file ${item.path} due to fetch error.`);
                }
            }
        }
        return items;
    } catch (error: any) {
        if (error.status === 404) {
            console.warn(`Path not found: ${path}. Skipping.`);
            return [];
        }
        throw error;
    }
}


export async function GET(request: Request) {
  const session = await auth();

  if (!(session?.user as any)?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
            return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
        }
        const items = await fetchRepoContents(octokit, owner, repo);
        const mappedItems = items.map(item => ({
            path: item.path,
            content: item.content,
            isFolder: item.type === 'dir'
        }));
        return NextResponse.json(mappedItems);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("GitHub GET Error:", error);
    return NextResponse.json(
      { error: error.message || "GitHub operation failed" },
      { status: error.status || 500 }
    );
  }
}
