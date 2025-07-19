
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
    const file = await File.findOne({ _id: fileId, userId }).lean();

    if (!file) {
      return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
    }

    // This is a minimal response used for fetching single file content.
    // The client-side state is the source of truth for UI properties.
    const fileJSON = {
      ...file,
      _id: file._id.toString(),
      parentId: file.parentId ? file.parentId.toString() : null,
    };

    return NextResponse.json(fileJSON);
  } catch (error) {
    console.error(`GET /api/files/${fileId} Error:`, error);
    return NextResponse.json({ error: "Failed to fetch file due to a server error." }, { status: 500 });
  }
}
