
import { NextResponse } from "next/server";
import axios, { isAxiosError } from "axios";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    // Note: In a real app, you might want to protect this more robustly
    // For this project, we allow any authenticated user to run code.
  }

  const { source_code, language_id, filename } = await request.json();

  if (!process.env.JUDGE0_API_KEY) {
      console.error("Judge0 API key not configured.");
      return NextResponse.json({ error: "Code execution service is not configured on the server." }, { status: 500 });
  }

  if (!source_code || !language_id) {
    return NextResponse.json(
      { error: "Missing source_code or language_id" },
      { status: 400 }
    );
  }

  const submissionData: any = {
      language_id: language_id,
      source_code: source_code,
  };

  // For Java (ID 62), the filename is critical for the compiler.
  // We use Judge0's additional_files feature to ensure the file has the correct name on the execution server.
  if (language_id === 62 && filename) {
<<<<<<< HEAD
      // The main class name must match the filename.
      const mainClassName = filename.endsWith('.java') ? filename.slice(0, -5) : filename;
      
      // When using additional_files, Judge0 compiles the files provided there.
      // The `source_code` field is still required by the API, but it's not the primary compilation target.
      // We can provide a minimal valid Java structure to satisfy the API.
=======
      // When using additional_files, Judge0 compiles the files provided there.
      // The `source_code` field is still required by the API, but it can be a placeholder.
>>>>>>> 78fe41ee1baffaab3b0285e9309c4c0acdfbdd54
      // The actual code to be compiled and run is in `additional_files`.
      submissionData.source_code = `// Main file: ${filename}`;
      submissionData.additional_files = [
          {
              file_name: filename,
              content: source_code
          }
      ];
<<<<<<< HEAD
=======
      // We must also tell Judge0 which file to run by setting `main_file`.
      submissionData.main_file = filename;
>>>>>>> 78fe41ee1baffaab3b0285e9309c4c0acdfbdd54
  }


  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
    params: {
      base64_encoded: 'false',
      wait: 'true', // Use wait=true to simplify and avoid polling
      fields: '*'   // Get all fields in the response
    },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: submissionData
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
            status = error.response.status;
            const responseData = error.response.data;

            if (status === 401 || status === 403) {
                 message = "Code execution failed: The API Key for the execution service is invalid or missing.";
            } else if (responseData && typeof responseData === 'object') {
                 message = (responseData as any).error || (responseData as any).message || `Judge0 responded with status ${status}`;
            } else {
                 message = `Judge0 responded with status ${status}`;
            }
            console.error("Judge0 Response Error Data:", error.response.data);
        } else if (error.request) {
            message = "No response received from the code execution service. It might be down or blocked by network policies.";
        } else {
            message = `Error setting up the code execution request: ${error.message}`;
        }
    } else if (error instanceof Error) {
        message = error.message;
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}
<<<<<<< HEAD
=======

>>>>>>> 78fe41ee1baffaab3b0285e9309c4c0acdfbdd54
