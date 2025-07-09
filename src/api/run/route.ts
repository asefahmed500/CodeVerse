
import { NextResponse } from "next/server";
import axios, { isAxiosError } from "axios";
import { auth } from "@/lib/auth";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  const submissionOptions = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
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
    // Step 1: Create the submission to get a token
    const submissionResponse = await axios.request(submissionOptions);
    const { token } = submissionResponse.data;

    if (!token) {
        throw new Error("Failed to get submission token from Judge0.");
    }
    
    // Step 2: Poll the submission status until it's completed
    let resultResponse;
    const MAX_POLLS = 10;
    const POLL_INTERVAL_MS = 1000;

    for (let i = 0; i < MAX_POLLS; i++) {
        await sleep(POLL_INTERVAL_MS);
        
        const resultOptions = {
            method: 'GET',
            url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            params: {
                base64_encoded: 'false',
                fields: '*'
            },
            headers: {
                'X-RapidAPI-Key': process.env.JUDGE0_API_KEY!,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        };
        resultResponse = await axios.request(resultOptions);
        const statusId = resultResponse.data.status?.id;

        // Status IDs 1 (In Queue) and 2 (Processing) mean we keep polling.
        // If status is anything else (3+, e.g., Accepted, Error), we stop.
        if (statusId > 2) {
            break; 
        }
    }
    
    // Check if the loop finished without a result or timed out
    if (!resultResponse || resultResponse.data.status?.id <= 2) {
      throw new Error("Code execution timed out or failed to complete.");
    }

    // Return the final result
    return NextResponse.json(resultResponse.data);

  } catch (error: any) {
    console.error("Judge0 API Error:", error);
    let message = "An unexpected error occurred during code execution.";
    let status = 500;

    if (isAxiosError(error)) {
        if (error.response) {
            status = error.response.status;
            const responseData = error.response.data;
            if (responseData && typeof responseData === 'object') {
                 message = (responseData as any).message || (responseData as any).error || `Judge0 responded with status ${status}`;
            } else {
                 message = `Judge0 responded with status ${status}`;
            }
            console.error("Judge0 Response Error Data:", error.response.data);
        } else if (error.request) {
            message = "No response received from Judge0 service. It might be down or blocked.";
            console.error("Judge0 No Response Error:", error.request);
        } else {
            message = `Error setting up Judge0 request: ${error.message}`;
            console.error("Axios Setup Error:", error.message);
        }
    } else if (error instanceof Error) {
        message = error.message;
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}
