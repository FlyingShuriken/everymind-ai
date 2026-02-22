import { genai, IMAGEN_MODEL } from "./vertex";
import { storagePut } from "@/lib/storage";

export interface SectionImage {
  url: string;
  caption: string;
  altText: string;
  sectionTitle: string;
}

export async function generateSectionImages(
  sectionTitle: string,
  sectionBody: string,
  courseTitle: string,
  sectionIndex: number,
): Promise<SectionImage[]> {
  const prompt = `Educational illustration for a course section titled "${sectionTitle}" in the course "${courseTitle}".
The illustration should visually represent the key concepts: ${sectionBody.slice(0, 500)}.
Style: clean, professional educational diagram with clear labels, high contrast, accessible color palette, minimal text, suitable for students with visual learning preferences.`;

  const response = await genai.models.generateImages({
    model: IMAGEN_MODEL,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "16:9",
    },
  });

  const images: SectionImage[] = [];

  for (let i = 0; i < (response.generatedImages?.length ?? 0); i++) {
    const imageData = response.generatedImages?.[i]?.image?.imageBytes;
    if (!imageData) continue;

    const buffer = Buffer.from(imageData, "base64");
    const filename = `visual/section-${sectionIndex}-img-${i}.png`;

    const stored = await storagePut(filename, buffer, { contentType: "image/png" });

    images.push({
      url: stored.url,
      caption: `Visual representation of ${sectionTitle}`,
      altText: `Educational illustration showing key concepts from the section "${sectionTitle}" in the course "${courseTitle}"`,
      sectionTitle,
    });
  }

  return images;
}
