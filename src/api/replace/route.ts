import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { File } from "@/models/File";
import dbConnect from "@/lib/db";

export async function POST(request: Request) {
  await dbConnect();
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, replaceWith } = await request.json();

  if (typeof query !== 'string' || !query || typeof replaceWith !== 'string') {
    return NextResponse.json({ error: "Invalid search or replace query." }, { status: 400 });
  }

  try {
    const userId = (session.user as any).id;
    // Use 'i' flag for case-insensitive matching, but replacement respects original casing
    const searchRegex = new RegExp(query, 'i');
    const replaceRegex = new RegExp(query, 'gi');

    const filesToUpdate = await File.find({
      userId,
      isFolder: false,
      content: { $regex: searchRegex },
    });

    let filesUpdated = 0;
    let totalReplacements = 0;
    
    // We use a for...of loop to handle async operations correctly.
    for (const file of filesToUpdate) {
        const originalContent = file.content;
        
        // Count actual replacements before performing them
        const replacementCount = (originalContent.match(replaceRegex) || []).length;
        
        if (replacementCount > 0) {
            const newContent = originalContent.replace(replaceRegex, replaceWith);
            file.content = newContent;
            await file.save();
            filesUpdated++;
            totalReplacements += replacementCount;
        }
    }

    return NextResponse.json({ 
        success: true, 
        filesUpdated,
        replacements: totalReplacements
    });

  } catch (error) {
    console.error("Replace operation failed:", error);
    return NextResponse.json(
      { error: "An error occurred during the replace operation." },
      { status: 500 }
    );
  }
}
