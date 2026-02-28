import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

function createGenAI(): GoogleGenAI {
  const useVertexAI = env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  if (useVertexAI) {
    return new GoogleGenAI({
      vertexai: true,
      project: env.GOOGLE_CLOUD_PROJECT,
      location: env.GOOGLE_CLOUD_LOCATION || "global",
    });
  }
  return new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
}

let _genai: GoogleGenAI | undefined;
export function getGenAI(): GoogleGenAI {
  if (!_genai) _genai = createGenAI();
  return _genai;
}

// Keep backward-compat export for existing callers
export const genai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    return (getGenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const GEMINI_MODEL = "gemini-3-flash-preview";
export const TTS_MODEL = "gemini-2.5-flash-tts";
export const IMAGEN_MODEL = "imagen-4.0-fast-generate-preview-06-06";
export const VEO_MODEL = "veo-3.1-fast-generate-001";
