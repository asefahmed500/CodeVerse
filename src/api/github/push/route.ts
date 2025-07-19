
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Octokit } from "octokit";

export async function POST(request: Request) {
    const session = await auth();

    if (!(session?.user as any)?.accessToken) {
        return NextResponse.json({ error: "GitHub account not connected or unauthorized" }, { status: 401 });
    }

    const { owner, repo, branch = 'main', files, commitMessage } = await request.json();

    if (!owner || !repo || !files || !commitMessage) {
        return NextResponse.json({ error: "Missing required parameters: owner, repo, files, commitMessage" }, { status: 400 });
    }
    
    if (files.length === 0) {
        return NextResponse.json({ error: "No files to commit" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: (session?.user as any).accessToken });

    try {
        // 1. Get the current branch reference to get the latest commit SHA
        const branchRef = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        });
        const latestCommitSha = branchRef.data.object.sha;

        // 2. Get the tree of the latest commit. This is crucial to preserve the existing repository structure.
        const { data: latestCommit } = await octokit.rest.git.getCommit({
            owner,
            repo,
            commit_sha: latestCommitSha,
        });
        const baseTreeSha = latestCommit.tree.sha;

        // 3. Create blobs for each file's content
        const blobs = await Promise.all(
            files.map(async (file: { path: string; content: string }) => {
                const blob = await octokit.rest.git.createBlob({
                    owner,
                    repo,
                    content: file.content,
                    encoding: "utf-8",
                });
                return {
                    path: file.path,
                    mode: '100644' as const,
                    type: 'blob' as const,
                    sha: blob.data.sha,
                };
            })
        );
        
        // 4. Create a new tree with our new file blobs, using the latest commit's tree as a base.
        // This correctly handles updates without needing to fetch the entire repo tree.
        const { data: newTree } = await octokit.rest.git.createTree({
            owner,
            repo,
            tree: blobs,
            base_tree: baseTreeSha,
        });
        const newTreeSha = newTree.sha;
        
        // 5. Create a new commit
        const { data: newCommit } = await octokit.rest.git.createCommit({
            owner,
            repo,
            message: commitMessage,
            tree: newTreeSha,
            parents: [latestCommitSha], // Link the new commit to the latest commit
            author: {
                name: session.user.name || 'CodeVerse User',
                email: session.user.email || 'noreply@codeverse.dev',
            },
        });
        const newCommitSha = newCommit.sha;

        // 6. Update the branch reference (e.g., 'main') to point to the new commit
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommitSha,
        });

        return NextResponse.json({ message: "Changes pushed successfully", sha: newCommitSha }, { status: 200 });

    } catch (error: any) {
        console.error("GitHub Push API Error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred while pushing to GitHub" },
            { status: error.status || 500 }
        );
    }
}
