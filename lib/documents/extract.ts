import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";

export interface ExtractedContent {
  type: "text" | "images";
  text?: string;
  images?: string[]; // base64 data URLs
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractedContent> {
  const parser = new PDFParse({
    verbosity: 0,
    data: new Uint8Array(buffer),
  });
  const MAX_PAGES = 10;
  await parser.load();
  const result = await parser.getScreenshot({ imageDataUrl: true, scale: 1 });
  await parser.destroy();

  const images = result.pages
    .slice(0, MAX_PAGES)
    .map((p: { dataUrl: string }) => p.dataUrl)
    .filter(Boolean);

  return { type: "images", images };
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
    case "application/pdf":
      return extractFromPdf(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractFromDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
