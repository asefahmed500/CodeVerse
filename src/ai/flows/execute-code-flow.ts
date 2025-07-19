'use server';
/**
 * @fileOverview An AI-powered code execution engine.
 *
 * - executeCodeWithAI - A function that uses an LLM to interpret and run code.
 * - ExecuteCodeInput - The input type for the executeCodeWithAI function.
 * - ExecuteCodeOutput - The return type for the executeCodeWithAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ExecuteCodeInputSchema = z.object({
  code: z.string().describe('The code snippet to be executed.'),
  language: z.string().describe('The programming language of the code snippet (e.g., javascript, python, java).'),
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

export const ExecuteCodeOutputSchema = z.object({
  stdout: z.string().optional().describe('The standard output (stdout) of the executed code. All output should be captured here.'),
  stderr: z.string().optional().describe('The standard error (stderr) of the executed code. All error messages, including syntax and runtime errors, should be captured here.'),
});
export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;

export async function executeCodeWithAI(input: ExecuteCodeInput): Promise<ExecuteCodeOutput> {
  return executeCodeFlow(input);
}

const executeCodeFlow = ai.defineFlow(
  {
    name: 'executeCodeFlow',
    inputSchema: ExecuteCodeInputSchema,
    outputSchema: ExecuteCodeOutputSchema,
  },
  async (input) => {
    const prompt = `You are a code interpreter. Your task is to execute the given code snippet and return its output.
The programming language is: ${input.language}

Code to execute:
\`\`\`${input.language}
${input.code}
\`\`\`

- Execute the code as if you were a command-line interpreter for that language.
- Capture ALL standard output and place it in the 'stdout' field.
- Capture ALL error messages (syntax, runtime, etc.) and place them in the 'stderr' field.
- If the code runs without errors, the 'stderr' field should be empty.
- If the code produces no standard output, the 'stdout' field should be empty.
- Do not add any explanations, introductory text, or markdown formatting. Only provide the raw output.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: ExecuteCodeOutputSchema,
      },
    });

    return llmResponse.output ?? { stdout: '', stderr: 'AI failed to generate a valid response.'};
  }
);
