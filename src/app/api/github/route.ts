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
    return NextResponse.json(
      { error: error.message || "GitHub operation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!(session?.user as any)?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, owner, repo, path, content, message, branch } =
    await request.json();

  try {
    const octokit = new Octokit({ auth: (session?.user as any).accessToken });

    switch (action) {
      case "createFile":
        const createResponse = await octokit.rest.repos.createOrUpdateFileContents(
          {
            owner,
            repo,
            path,
            message: message || "Create file",
            content: btoa(content),
            branch: branch || "main",
          }
        );
        return NextResponse.json(createResponse.data);
      case "createPullRequest":
        const prResponse = await octokit.rest.pulls.create({
          owner,
          repo,
          title: message || "New changes",
          head: `patch-${Date.now()}`,
          base: branch || "main",
        });
        return NextResponse.json(prResponse.data);
      case "createBranch":
        const branchResponse = await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: (
            await octokit.rest.repos.getBranch({
              owner,
              repo,
              branch: "main",
            })
          ).data.commit.sha,
        });
        return NextResponse.json(branchResponse.data);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "GitHub operation failed" },
      { status: 500 }
    );
  }
}
