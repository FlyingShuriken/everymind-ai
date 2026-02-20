import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCourse, type CourseInput } from "@/lib/ai/course-generator";
import { extractContent } from "@/lib/documents/extract";
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

    const input: CourseInput = {};

    for (const source of sources) {
      if (source.type === "topic") {
        input.text = (input.text ?? "") + (source.text ?? "");
      } else if (source.type === "file" && source.url) {
        const buffer = await storageGet(source.url);
        const mimeType = source.url.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf";
        const extracted = await extractContent(buffer, mimeType);

        if (extracted.type === "images" && extracted.images) {
          input.images = [...(input.images ?? []), ...extracted.images];
        } else if (extracted.text) {
          input.text = (input.text ?? "") + extracted.text + "\n\n";
        }
      }
    }

    if (!input.text?.trim() && !input.images?.length) {
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
