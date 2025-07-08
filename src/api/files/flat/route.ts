import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { File } from "@/models/File"
import dbConnect from "@/lib/db"
import type { FileType } from "@/types"

export async function GET() {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id;
    const allUserFiles = await File.find({ userId }).lean();
    
    if (!allUserFiles.length) {
      return NextResponse.json([]);
    }

    const fileMap = new Map(allUserFiles.map(f => [f._id.toString(), f]));
    
    const getPath = (fileId: string): string => {
        const file = fileMap.get(fileId);
        if (!file) return '';
        if (!file.parentId) return file.name;
        const parentPath = getPath(file.parentId.toString());
        return parentPath ? `${parentPath}/${file.name}` : file.name;
    };

    const filesWithPaths = allUserFiles
      .filter(file => !file.isFolder)
      .map(file => ({
        path: getPath(file._id.toString()),
        content: file.content
      }));

    return NextResponse.json(filesWithPaths)
  } catch (error) {
    console.error("Failed to fetch flat file list:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" }, 
      { status: 500 }
    )
  }
}
