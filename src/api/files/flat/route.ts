import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { File } from "@/models/File";
import dbConnect from "@/lib/db";
import type { FileType } from "@/types";

async function createStructure(files: { path: string, content: string }[], userId: string) {
    const rootFiles = await File.find({ userId, parentId: null });
    if (rootFiles.length > 0) {
      await File.deleteMany({ userId });
    }
  
    const dirMap = new Map<string, any>();
  
    for (const file of files) {
      const parts = file.path.split('/');
      let currentParentId = null;
      let currentPath = '';
  
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = i === 0 ? part : `${currentPath}/${part}`;
  
        if (i < parts.length - 1) { // It's a directory
          if (!dirMap.has(currentPath)) {
            const newDir = new File({
              name: part,
              isFolder: true,
              userId: userId,
              parentId: currentParentId,
              children: []
            });
            await newDir.save();
            dirMap.set(currentPath, newDir);

            if (currentParentId) {
                await File.findByIdAndUpdate(currentParentId, { $push: { children: newDir._id } });
            }
            currentParentId = newDir._id;

          } else {
            currentParentId = dirMap.get(currentPath)._id;
          }
        } else { // It's a file
          const newFile = new File({
            name: part,
            isFolder: false,
            userId: userId,
            parentId: currentParentId,
            content: file.content
          });
          await newFile.save();
          if (currentParentId) {
            await File.findByIdAndUpdate(currentParentId, { $push: { children: newFile._id } });
          }
        }
      }
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const filesToCreate = await request.json();

    try {
        await createStructure(filesToCreate, userId);
        return NextResponse.json({ success: true });
    } catch(error) {
        console.error("Failed to flatten/create repo structure:", error);
        return NextResponse.json({ error: "Failed to create repository structure" }, { status: 500 });
    }
}
