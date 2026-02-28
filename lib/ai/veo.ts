import { genai, VEO_MODEL } from "./vertex";
import { storagePut } from "@/lib/storage";

// Veo 3.1 Fast supports 4, 6, or 8 seconds for text-to-video
const MAX_DURATION_SECONDS = 8;

export async function generateSectionVideo(
  sectionTitle: string,
  sectionSummary: string,
  courseTitle: string,
  sectionIndex: number,
): Promise<string> {
  const prompt = `Create a short ${MAX_DURATION_SECONDS}-second educational explainer video for a course section titled "${sectionTitle}" from the course "${courseTitle}".
The video should visually illustrate: ${sectionSummary.slice(0, 300)}.
Style: clear, professional educational animation. No talking head. Show concepts visually with icon or graphic labels, the video should not include any text. High contrast, accessible design.`;

  // Start video generation (long-running operation)
  let operation = await genai.models.generateVideos({
    model: VEO_MODEL,
    prompt,
    config: {
      durationSeconds: MAX_DURATION_SECONDS,
      aspectRatio: "16:9",
    },
  });

  // Poll until complete via operations.getVideosOperation (up to 5 minutes)
  for (let attempt = 0; attempt < 60; attempt++) {
    if (operation.done) break;
    await new Promise((r) => setTimeout(r, 5000));
    operation = await genai.operations.getVideosOperation({ operation });
  }

  if (!operation.done) {
    throw new Error("Video generation timed out after 5 minutes");
  }

  const videoBytes =
    operation.response?.generatedVideos?.[0]?.video?.videoBytes;
  if (!videoBytes) {
    throw new Error("No video data returned from Veo");
  }

  const buffer = Buffer.from(videoBytes, "base64");
  const filename = `video/section-${sectionIndex}.mp4`;

  const stored = await storagePut(filename, buffer, {
    contentType: "video/mp4",
  });
  return stored.url;
}
