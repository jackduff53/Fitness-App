import { ParsedFoodResult } from '@/types';

/**
 * Sends a natural language food description to the server-side API route
 * for parsing via OpenAI, and returns structured nutrition data.
 *
 * @param description - Natural language food description (e.g., "2 eggs and toast with butter")
 * @returns Parsed nutrition data including calories, macros, and heart health flags
 * @throws Error on network failures or non-OK API responses
 */
export async function parseFoodDescription(description: string): Promise<ParsedFoodResult> {
  const response = await fetch('/api/food-parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Food parse API error (${response.status}): ${errorText}`);
  }

  const data: ParsedFoodResult = await response.json();
  return data;
}
