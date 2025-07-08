import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { File } from "@/models/File";
import dbConnect from "@/lib/db";
import type { FileType, SearchResult, SearchMatch } from "@/types";

export async function POST(request: Request) {
  await dbConnect();
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await request.json();

  try {
    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const filesWithContentMatch = await File.find({
      userId: (session.user as any).id,
      isFolder: false,
      content: { $regex: query, $options: "i" },
    }).select("name content _id parentId isFolder language");

    const results: SearchResult[] = filesWithContentMatch.map((file: FileType) => {
      const lines = file.content.split('\n');
      const matches: SearchMatch[] = [];
      const regex = new RegExp(query, 'gi');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matches.push({
            lineNumber: index + 1,
            lineContent: line.trim(),
          });
        }
      });
      
      return { file, matches };
    }).filter(result => result.matches.length > 0);
    
    const filesWithFilenameMatch = await File.find({
        userId: (session.user as any).id,
        isFolder: false,
        name: { $regex: query, $options: "i" },
        _id: { $nin: results.map(r => r.file._id) } // Exclude files already matched by content
      }).select("name content _id parentId isFolder language");

    filesWithFilenameMatch.forEach((file: FileType) => {
        results.push({ file, matches: [] }); // Filename matched, but no content matches
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
