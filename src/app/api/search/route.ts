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

  const { query } = await request.json();

  try {
    if (!query) {
      return NextResponse.json({ results: [] });
    }
    const results = await File.find({
      userId: (session.user as any).id,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    }).select("name content _id parentId isFolder language");

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
