/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It ensures a single, configured instance of Genkit is available throughout the application.
 */
import { genkit, ai } from 'genkit';
import { googleAI } from 'genkit/plugins';

// This global `ai` instance is used throughout the app to interact with Genkit.
export { ai };

// Configure Genkit with the Google AI plugin.
// This is the correct way to initialize plugins in Genkit v1.x.
genkit({
  plugins: [
    googleAI(),
  ],
  enableTracingAndMetrics: true,
});
