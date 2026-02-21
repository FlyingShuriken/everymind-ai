import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";

export interface ExtractedContent {
  type: "text" | "images";
  text?: string;
  images?: string[]; // base64 data URLs
}

export interface PageChunk {
  pages: string[]; // base64 data URLs
  chunkIndex: number;
  totalChunks: number;
}

export async function extractPageChunks(
  buffer: Buffer,
  chunkSize = 4,
): Promise<PageChunk[]> {
  const parser = new PDFParse({
    verbosity: 0,
    data: new Uint8Array(buffer),
  });
  await parser.load();
  const result = await parser.getScreenshot({ imageDataUrl: true, scale: 1 });
  await parser.destroy();

  const allPages: string[] = result.pages
    .map((p: { dataUrl: string }) => p.dataUrl)
    .filter(Boolean);

  const chunks: PageChunk[] = [];
  for (let i = 0; i < allPages.length; i += chunkSize) {
    chunks.push({
      pages: allPages.slice(i, i + chunkSize),
      chunkIndex: chunks.length,
      totalChunks: Math.ceil(allPages.length / chunkSize),
    });
  }

  // Fix totalChunks now that we know the final count
  const total = chunks.length;
  for (const chunk of chunks) {
    chunk.totalChunks = total;
  }

  return chunks;
}

export async function extractFromDocx(buffer: Buffer): Promise<ExtractedContent> {
  const result = await mammoth.extractRawText({ buffer });
  return { type: "text", text: result.value.trim() };
}

export async function extractContent(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedContent> {
  switch (mimeType) {
    case "application/pdf": {
      const chunks = await extractPageChunks(buffer);
      const allImages = chunks.flatMap((c) => c.pages);
      return { type: "images", images: allImages };
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractFromDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
