// This API endpoint is deprecated. Search operations are now handled entirely on the client-side.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This API endpoint is deprecated and no longer in use." }, 
    { status: 410 } // 410 Gone
  );
}
