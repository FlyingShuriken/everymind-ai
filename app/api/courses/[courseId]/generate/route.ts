import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCourse, type CourseInput } from "@/lib/ai/course-generator";
import { extractContent, extractPageChunks } from "@/lib/documents/extract";
import { storageGet } from "@/lib/storage";

export async function POST(
  _request: Request,
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

  const course = await prisma.course.findFirst({
    where: { id: courseId, creatorId: user.id },
    include: { studentProfile: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (course.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Course already generated or in progress" },
      { status: 400 },
    );
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "PROCESSING" },
  });

  try {
    const sources = JSON.parse(
      course.sourceMaterials as string,
    ) as Array<{ type: string; url?: string; text?: string }>;

    const DOCX_MIME =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const PDF_MIME = "application/pdf";

    const fileSources = sources.filter((s) => s.type === "file" && s.url);
    const textSources = sources.filter((s) => s.type === "topic");

    // Extract all files in parallel
    const fileInputs = await Promise.all(
      fileSources.map(async (source) => {
        const buffer = await storageGet(source.url!);
        const mimeType = source.url!.endsWith(".docx") ? DOCX_MIME : PDF_MIME;
        if (mimeType === PDF_MIME) {
          return { type: "pdf" as const, chunks: await extractPageChunks(buffer) };
        } else {
          const extracted = await extractContent(buffer, mimeType);
          return { type: "text" as const, text: extracted.text ?? "" };
        }
      }),
    );

    const filePdfs = fileInputs
      .filter((f) => f.type === "pdf")
      .map((f) => f.chunks!);

    const textParts = [
      ...textSources.map((s) => s.text ?? ""),
      ...fileInputs.filter((f) => f.type === "text").map((f) => f.text!),
    ].filter(Boolean);

    const input: CourseInput = {
      filePdfs: filePdfs.length ? filePdfs : undefined,
      text: textParts.length ? textParts.join("\n\n") : undefined,
      studentProfile: course.studentProfile
        ? {
            disabilities: course.studentProfile.disabilities as string[],
            preferences: course.studentProfile.preferences as string[],
            accessibilityNeeds: course.studentProfile.accessibilityNeeds as {
              fontSize: string;
              highContrast: boolean;
              reducedMotion: boolean;
              screenReaderOptimized: boolean;
            },
          }
        : undefined,
    };

    if (!input.text?.trim() && !input.filePdfs?.length) {
      throw new Error("No content could be extracted from source materials");
    }

    const { outline, sections } = await generateCourse(input);

    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: outline.title,
        description: outline.description,
      },
    });

    for (let i = 0; i < sections.length; i++) {
      await prisma.courseContent.create({
        data: {
          courseId,
          contentType: "TEXT",
          contentData: JSON.stringify(sections[i]),
          metadata: JSON.stringify({
            outlineSection: outline.sections[i],
          }),
          orderIndex: i,
        },
      });
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { status: "READY" },
    });

    return NextResponse.json({ status: "READY" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    await prisma.course.update({
      where: { id: courseId },
      data: { status: "ERROR", generationError: message },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
