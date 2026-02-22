import { genai, TTS_MODEL } from "./vertex";
import { storagePut } from "@/lib/storage";

// Gemini TTS returns raw 16-bit PCM mono at 24kHz — wrap in a WAV container
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);   // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);             // PCM chunk size
  header.writeUInt16LE(1, 20);             // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export async function generateSpeech(
  text: string,
  contentId: string,
): Promise<string> {
  const response = await genai.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: text.slice(0, 8000) }],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) {
    throw new Error("No audio data returned from Gemini TTS");
  }

  const pcm = Buffer.from(part.data, "base64");
  const wav = pcmToWav(pcm);

  const result = await storagePut(`tts/${contentId}.wav`, wav, {
    contentType: "audio/wav",
  });

  return result.url;
}
