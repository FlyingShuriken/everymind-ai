import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSpeech } from "@/lib/ai/tts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { contentId } = await request.json();
  if (!contentId) {
    return NextResponse.json(
      { error: "contentId required" },
      { status: 400 },
    );
  }

  const content = await prisma.courseContent.findFirst({
    where: { id: contentId, courseId },
  });

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // Check if audio already cached
  const metadata = JSON.parse((content.metadata as string) || "{}");
  if (metadata.audioUrl) {
    return NextResponse.json({ audioUrl: metadata.audioUrl });
  }

  // Generate TTS from content body
  const contentData = JSON.parse(content.contentData as string);
  const text = contentData.body || contentData.summary || "";

  if (!text) {
    return NextResponse.json(
      { error: "No text content to convert" },
      { status: 400 },
    );
  }

  // Strip markdown for cleaner speech
  const plainText = text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`[^`]+`/g, "");

  const audioUrl = await generateSpeech(plainText, content.id);

  // Cache audio URL in metadata
  await prisma.courseContent.update({
    where: { id: content.id },
    data: {
      metadata: JSON.stringify({ ...metadata, audioUrl }),
    },
  });

  return NextResponse.json({ audioUrl });
}
