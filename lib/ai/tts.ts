import OpenAI from "openai";
import { put } from "@vercel/blob";

// TTS requires direct OpenAI API (not OpenRouter)
const ttsClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSpeech(
  text: string,
  contentId: string,
): Promise<string> {
  const mp3 = await ttsClient.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text.slice(0, 4096),
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  const blob = await put(`tts/${contentId}.mp3`, buffer, {
    access: "public",
    contentType: "audio/mpeg",
  });

  return blob.url;
}
