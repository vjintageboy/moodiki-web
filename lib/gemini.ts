import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
// Note: This must only be used on the server side to protect the API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ModerationResult {
  isToxic: boolean;
  reason: string;
}

/**
 * Analyzes text content using Gemini AI to determine if it violates community guidelines.
 * Looks for hate speech, harassment, explicit content, or dangerous activities.
 * 
 * @param text The content to analyze
 * @returns ModerationResult containing boolean flag and explanation
 */
export async function analyzeContent(text: string): Promise<ModerationResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Skipping AI moderation.');
    return { isToxic: false, reason: 'Moderation bypassed (no API key)' };
  }

  const prompt = `
You are an AI content moderator for a mental health community forum.
Your task is to analyze the following user post and determine if it violates our safety guidelines.

Safety Guidelines - Content should be flagged if it contains:
1. Hate speech or discrimination
2. Severe harassment or bullying
3. Encouragement of self-harm or suicide
4. Explicit sexual content
5. Illegal or dangerous activities
6. Scams or spam

Analyze the following text:
"${text}"

Return ONLY a valid JSON object with exactly these two keys:
- "isToxic": boolean (true if it violates guidelines, false otherwise)
- "reason": string (a short 1-sentence explanation of why it was flagged or why it is safe)

Do NOT include markdown formatting like \`\`\`json in your response. Only return the raw JSON object.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '{}';
    // Clean up potential markdown formatting if the model still includes it
    const cleanJson = responseText.replace(/```json\n|\n```|```/g, '').trim();
    
    const result = JSON.parse(cleanJson);
    
    return {
      isToxic: Boolean(result.isToxic),
      reason: result.reason || 'No reason provided',
    };
  } catch (error) {
    console.error('Gemini AI moderation error:', error);
    // Fail open - don't block content if moderation service is down
    return { isToxic: false, reason: 'Moderation service error' };
  }
}
