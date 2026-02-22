import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const progressBodySchema = z.object({
  contentId: z.string(),
  completed: z.boolean().optional(),
  timeSpent: z.number().optional(),
});

export async function GET(
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

  const rows = await prisma.userProgress.findMany({
    where: { userId: user.id, courseId },
  });

  const progressMap: Record<
    string,
    { completed: boolean; timeSpent: number; performanceData: unknown }
  > = {};

  for (const row of rows) {
    if (!row.contentId) continue;
    progressMap[row.contentId] = {
      completed: row.completed,
      timeSpent: row.timeSpent,
      performanceData: row.performanceData ?? null,
    };
  }

  return NextResponse.json(progressMap);
}

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

  const body = await request.json();
  const parsed = progressBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { contentId, completed, timeSpent } = parsed.data;

  await prisma.userProgress.upsert({
    where: {
      userId_courseId_contentId: { userId: user.id, courseId, contentId },
    },
    update: {
      ...(completed !== undefined && { completed }),
      ...(timeSpent !== undefined && { timeSpent }),
    },
    create: {
      userId: user.id,
      courseId,
      contentId,
      completed: completed ?? false,
      timeSpent: timeSpent ?? 0,
    },
  });

  return NextResponse.json({ success: true });
}
