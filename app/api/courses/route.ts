import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCourseSchema } from "@/lib/validators";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const courses = await prisma.course.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 },
    );
  }

  const { title, sourceType, topic, fileUrls, studentProfileId } = parsed.data;

  // Validate profile belongs to user if provided
  if (studentProfileId) {
    const profile = await prisma.studentProfile.findFirst({
      where: { id: studentProfileId, userId: user.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  }

  const course = await prisma.course.create({
    data: {
      title,
      creatorId: user.id,
      studentProfileId: studentProfileId ?? null,
      sourceMaterials: JSON.stringify(
        sourceType === "upload"
          ? (fileUrls ?? []).map((url) => ({ type: "file", url }))
          : [{ type: "topic", text: topic }],
      ),
    },
  });

  return NextResponse.json(course, { status: 201 });
}
