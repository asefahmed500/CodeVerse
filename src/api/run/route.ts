import { NextResponse } from "next/server";
import axios from "axios";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source_code, language_id } = await request.json();

  if (!source_code || !language_id) {
    return NextResponse.json(
      { error: "Missing source_code or language_id" },
      { status: 400 }
    );
  }

  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
    params: {
      base64_encoded: 'false',
      wait: 'true', // Wait for the execution to complete
      fields: '*'
    },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: {
      language_id: language_id,
      source_code: source_code,
    }
  };

  try {
    const response = await axios.request(options);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Judge0 API Error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || "Failed to execute code";
    return NextResponse.json({ error: message }, { status });
  }
}
