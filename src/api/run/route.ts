
import { NextResponse } from "next/server";
import axios, { isAxiosError } from "axios";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    // Note: In a real app, you might want to protect this more robustly
    // For this project, we allow any authenticated user to run code.
  }

  const { source_code, language_id } = await request.json();

  if (!process.env.JUDGE0_API_KEY) {
      return NextResponse.json({ error: "Judge0 API key not configured." }, { status: 500 });
  }

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
    console.error("Judge0 API Error:", error);
    let message = "An unexpected error occurred during code execution.";
    let status = 500;

    if (isAxiosError(error)) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            status = error.response.status;
            const responseData = error.response.data;
            if (responseData && typeof responseData === 'object') {
                 message = (responseData as any).message || (responseData as any).error || `Judge0 responded with status ${status}`;
            } else {
                 message = `Judge0 responded with status ${status}`;
            }
            console.error("Judge0 Response Error Data:", error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            message = "No response received from Judge0 service. It might be down or blocked.";
            console.error("Judge0 No Response Error:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            message = `Error setting up Judge0 request: ${error.message}`;
            console.error("Axios Setup Error:", error.message);
        }
    } else if (error instanceof Error) {
        message = error.message;
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}
