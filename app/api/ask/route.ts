import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function buildFallbackImageQuery(question: string, explanation?: string) {
  // Extract key concepts from the question and explanation
  const source = `${question} ${explanation || ""}`.toLowerCase();
  
  // Remove common words and keep only meaningful terms
  const stopWords = new Set([
    "what", "is", "are", "the", "a", "an", "of", "in", "to", "for", "and", "on", "about", 
    "explain", "definition", "define", "tell", "me", "do", "we", "by", "with", "how",
    "this", "that", "these", "those", "it", "its", "they", "them", "their", "from",
    "when", "where", "why", "which", "who", "whose", "can", "could", "will", "would",
    "should", "may", "might", "must", "shall", "let", "get", "got", "have", "has", "had"
  ]);
  
  // Clean and extract meaningful words
  const cleaned = source
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const words = cleaned
    .split(" ")
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 4); // Limit to 4 most relevant words
  
  // If we don't have enough words, add some generic educational terms
  if (words.length < 2) {
    words.push("diagram", "illustration");
  }
  
  return words.join(" ");
}

const SYSTEM_PROMPT = `You are an expert teacher and educational assistant. Your role is to help students understand complex concepts by providing clear, step-by-step explanations.

When responding to student questions, always format your response in exactly FOUR fields:

1. "avatar_script": A friendly, conversational introduction that the AI avatar will speak first (keep this under 50 words, natural and engaging)
2. "avatar_steps": An array of 3-6 conversational steps for the avatar to speak one at a time, breaking down the answer step-by-step in a human, interactive way. Each step should be:
   - A complete sentence that makes sense when spoken aloud
   - Conversational and engaging (like a real teacher explaining)
   - Under 25 words each for natural speech flow
   - Cover the complete explanation from start to finish
   - Use phrases like "Now, let me show you..." or "Here's what happens..." or "Let's break this down..."
3. "text_explanation": A detailed, step-by-step explanation with proper formatting
4. "image_query": 3-5 concise search keywords optimized for Wikimedia Commons to fetch a relevant diagram for the topic. Use specific, technical terms that Wikimedia Commons would have (e.g., "quadratic equation", "human heart anatomy", "photosynthesis process", "newton laws physics", "mitochondria structure"). Avoid generic words like "diagram", "image", "picture". Use only the most relevant scientific/technical terms.

For the text_explanation section:
- Use clear headings and bullet points
- For mathematical expressions, use LaTeX formatting:
  - Inline math: \\( ... \\) (e.g., \\(E = mc^2\\))
  - Block math: \\[ ... \\] (e.g., \\[\\int_0^\\infty e^{-x} dx = 1\\])
- Use markdown formatting for structure
- Break down complex concepts into simple steps
- Include examples where helpful
- Be encouraging and supportive

Respond ONLY with a valid JSON object, no code block markers, no markdown, no explanations, and no extra text. Do not include any text before or after the JSON object. Do not use triple backticks or the word 'json'.

Example response format:
{
  "avatar_script": "Great question! Let me break this down for you step by step.",
  "avatar_steps": [
    "First, let me explain what a quadratic equation actually is - it's an equation where the highest power is squared.",
    "Now, the standard form looks like this: ax squared plus bx plus c equals zero, where a, b, and c are numbers.",
    "To solve it, we use the quadratic formula: x equals negative b plus or minus the square root of b squared minus 4ac, all divided by 2a.",
    "Let me show you how this works with a simple example to make it clearer."
  ],
  "text_explanation": "# Understanding Quadratic Equations...",
  "image_query": "quadratic equation parabola"
}

Always respond in this exact JSON format with all four fields. The avatar_steps should be the main content that gets spoken, while avatar_script is just a brief introduction.`;

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Question is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `${SYSTEM_PROMPT}

Student Question: "${question}"

Please provide your response in the exact JSON format specified above.`;

    // Retry wrapper for transient 5xx errors (model overload, etc.)
    async function generateWithRetry(maxAttempts = 3) {
      let attempt = 0;
      let lastErr: unknown;
      while (attempt < maxAttempts) {
        try {
          return await model.generateContent(prompt);
        } catch (err: any) {
          lastErr = err;
          const message = String(err?.message || "");
          const status: number | undefined = err?.status || err?.response?.status;
          // Retry on 429/5xx and overloaded messages
          const retriable = status === 429 || (status && status >= 500) ||
            message.includes("overloaded") || message.includes("temporarily unavailable") || message.includes("quota") || message.includes("rate");
          attempt++;
          if (!retriable || attempt >= maxAttempts) {
            throw err;
          }
          const backoffMs = Math.min(2000 * attempt, 6000);
          await new Promise(r => setTimeout(r, backoffMs));
        }
      }
      throw lastErr;
    }

    const result = await generateWithRetry(3);
    const response = await result.response;
    const text = response.text();

    let parsedResponse: any;
    try {
      // Remove BOM and non-printable characters before and after the JSON object
      let cleanText = text.replace(/^[^\{]*/, '').replace(/[^\}]*$/, '').trim();
      try {
        parsedResponse = JSON.parse(cleanText);
      } catch (e) {
        // Try to repair the JSON if parsing fails
        parsedResponse = JSON.parse(jsonrepair(cleanText));
      }
    } catch (e1) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (e) {
            parsedResponse = JSON.parse(jsonrepair(jsonMatch[0]));
          }
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (e2) {
        console.error("Failed to parse Gemini response as JSON:", text);
        // Fallback: create a structured response from the raw text
        const lines = text.split('\n').filter(line => line.trim());
        const avatarScript = lines[0] || "Let me explain this concept to you step by step.";
        const textExplanation = lines.slice(1).join('\n') || text;
        parsedResponse = {
          avatar_script: avatarScript,
          avatar_steps: [avatarScript],
          text_explanation: textExplanation,
          image_query: buildFallbackImageQuery(question, textExplanation),
        };
      }
    }

    if (!parsedResponse.avatar_script || !parsedResponse.text_explanation) {
      throw new Error("Invalid response structure from Gemini");
    }

    if (!parsedResponse.image_query || typeof parsedResponse.image_query !== "string" || parsedResponse.image_query.length < 2) {
      parsedResponse.image_query = buildFallbackImageQuery(question, parsedResponse.text_explanation);
    }

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process question",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 