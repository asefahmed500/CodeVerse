'use server';
/**
 * @fileOverview An AI agent for explaining code.
 *
 * - explainCode - A function that provides an explanation for a code snippet.
 * - ExplainCodeInput - The input type for the explainCode function.
 * - ExplainCodeOutput - The return type for the explainCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const ExplainCodeInputSchema = z.object({
  code: z.string().describe('The code snippet to be explained.'),
});
export type ExplainCodeInput = z.infer<typeof ExplainCodeInputSchema>;

export const ExplainCodeOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the code, formatted in markdown.'),
});
export type ExplainCodeOutput = z.infer<typeof ExplainCodeOutputSchema>;

export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeOutput> {
  return explainCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCodePrompt',
  input: {schema: ExplainCodeInputSchema},
  output: {schema: ExplainCodeOutputSchema},
  prompt: `You are an expert code reviewer. Explain what this code does in a clear and concise way. Format your response using markdown.

Code:
\`\`\`
{{{code}}}
\`\`\`
`,
});

const explainCodeFlow = ai.defineFlow(
  {
    name: 'explainCodeFlow',
    inputSchema: ExplainCodeInputSchema,
    outputSchema: ExplainCodeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
