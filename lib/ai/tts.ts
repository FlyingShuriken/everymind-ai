import OpenAI from "openai";
import { storagePut } from "@/lib/storage";
import { env } from "@/lib/env";

// TTS requires direct OpenAI API (not OpenRouter)
const ttsClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

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

  const result = await storagePut(`tts/${contentId}.mp3`, buffer, {
    contentType: "audio/mpeg",
  });

  return result.url;
}
