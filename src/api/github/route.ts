import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Octokit } from "octokit";

export async function GET(request: Request) {
  const session = await auth();

  if (!(session?.user as any)?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    const octokit = new Octokit({ auth: (session?.user as any).accessToken });

    switch (action) {
      case "getRepos":
        const repos = await octokit.rest.repos.listForAuthenticatedUser({
          sort: "updated",
          per_page: 100,
        });
        return NextResponse.json(repos.data);
      case "getRepoContent":
        const owner = searchParams.get("owner")!;
        const repo = searchParams.get("repo")!;
        const path = searchParams.get("path") || "";
        const content = await octokit.rest.repos.getContent({ owner, repo, path });
        return NextResponse.json(content.data);
      case "getBranches":
        const branchOwner = searchParams.get("owner")!;
        const branchRepo = searchParams.get("repo")!;
        const branches = await octokit.rest.repos.listBranches({
          owner: branchOwner,
          repo: branchRepo,
        });
        return NextResponse.json(branches.data);
      case "getUser":
        const user = await octokit.rest.users.getAuthenticated();
        return NextResponse.json(user.data);
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

export async function POST(request: Request) {
  const session = await auth();

  if (!(session?.user as any)?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    const octokit = new Octokit({ auth: (session?.user as any).accessToken });

    switch (action) {
      case "commitAndPush":
        const { owner, repo, branch, message, files } = body;
        const newBranchName = `feat/codeverse-commit-${Date.now()}`;

        const baseBranch = await octokit.rest.repos.getBranch({ owner, repo, branch });
        const baseSha = baseBranch.data.commit.sha;
        
        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${newBranchName}`,
            sha: baseSha,
        });
        
        const blobs = await Promise.all(
            (files as { path: string, content: string }[]).map(file =>
                octokit.rest.git.createBlob({
                    owner,
                    repo,
                    content: Buffer.from(file.content, 'utf-8').toString('base64'),
                    encoding: 'base64',
                }).then(blob => ({
                    path: file.path,
                    mode: '100644' as const,
                    type: 'blob' as const,
                    sha: blob.data.sha,
                }))
            )
        );
        
        const latestCommit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: baseSha });

        const tree = await octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: latestCommit.data.tree.sha,
            tree: blobs,
        });

        const newCommit = await octokit.rest.git.createCommit({
            owner,
            repo,
            message,
            tree: tree.data.sha,
            parents: [baseSha],
        });
        
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${newBranchName}`,
            sha: newCommit.data.sha,
        });

        const pr = await octokit.rest.pulls.create({
            owner,
            repo,
            title: message,
            head: newBranchName,
            base: branch,
            body: 'Changes committed from CodeVerse.',
        });
        
        return NextResponse.json({ success: true, prUrl: pr.data.html_url });
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("GitHub POST Error:", error);
    return NextResponse.json(
      { error: error.message || "GitHub operation failed" },
      { status: error.status || 500 }
    );
  }
}
