// This API endpoint is deprecated. Terminal sessions are now handled entirely on the client-side.
import { NextResponse } from "next/server";

const DeprecatedResponse = () => NextResponse.json(
    { error: "This API endpoint is deprecated and no longer in use." }, 
    { status: 410 } // 410 Gone
);

export async function GET() {
  return DeprecatedResponse();
}

export async function POST() {
  return DeprecatedResponse();
}

export async function PUT() {
  return DeprecatedResponse();
}

export async function DELETE() {
  return DeprecatedResponse();
}
