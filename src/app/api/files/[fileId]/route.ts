import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import File from "@/models/file";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { fileId } = params;

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
  }

  try {
    await dbConnect();
    // Ensure the file belongs to the authenticated user
    const file = await File.findOne({ _id: fileId, userId }).lean();

    if (!file) {
      return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
    }

    // Sanitize the response object to match what the client expects.
    // Convert ObjectId instances to strings for serialization.
    const fileJSON = {
      ...file,
      _id: file._id.toString(),
      parentId: file.parentId ? file.parentId.toString() : null,
      // Ensure client-side fields are present even if not in DB
      isOpen: false, 
      isActive: false, 
    };

    return NextResponse.json(fileJSON);
  } catch (error) {
    console.error(`GET /api/files/${fileId} Error:`, error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
