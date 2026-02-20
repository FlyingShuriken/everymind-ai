import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCourse } from "@/lib/ai/course-generator";
import { extractText } from "@/lib/documents/extract";

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

  // Set to PROCESSING
  await prisma.course.update({
    where: { id: courseId },
    data: { status: "PROCESSING" },
  });

  try {
    // Extract text from source materials
    const sources = JSON.parse(
      course.sourceMaterials as string,
    ) as Array<{ type: string; url?: string; text?: string }>;

    let inputText = "";

    for (const source of sources) {
      if (source.type === "topic") {
        inputText += source.text ?? "";
      } else if (source.type === "file" && source.url) {
        const response = await fetch(source.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType =
          response.headers.get("content-type") ?? "application/pdf";
        const extracted = await extractText(buffer, contentType);
        inputText += extracted + "\n\n";
      }
    }

    if (!inputText.trim()) {
      throw new Error("No text could be extracted from source materials");
    }

    const isUpload = sources[0]?.type === "file";
    const { outline, sections } = await generateCourse(inputText, isUpload);

    // Update course title/description from outline
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: outline.title,
        description: outline.description,
      },
    });

    // Create CourseContent rows for each section
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

    // Set to READY
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
