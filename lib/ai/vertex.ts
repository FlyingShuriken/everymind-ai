import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

// const globalForGenAI = globalThis as unknown as {
//   genai: GoogleGenAI | undefined;
// };

export const genai = new GoogleGenAI({
  // apiKey: env.GOOGLE_API_KEY,
  vertexai: env.GOOGLE_GENAI_USE_VERTEXAI === "true",
  project: env.GOOGLE_CLOUD_PROJECT,
  location: env.GOOGLE_CLOUD_LOCATION || "global",
});

// if (env.NODE_ENV !== "production") globalForGenAI.genai = genai;

export const GEMINI_MODEL = "gemini-3-flash-preview";
export const TTS_MODEL = "gemini-2.5-flash-tts";
export const IMAGEN_MODEL = "imagen-4.0-fast-generate-preview-06-06";
export const VEO_MODEL = "veo-3.1-fast-generate-001";
