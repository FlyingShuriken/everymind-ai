import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const studentProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  disabilities: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  accessibilityNeeds: z
    .object({
      fontSize: z.string().default("medium"),
      highContrast: z.boolean().default(false),
      reducedMotion: z.boolean().default(false),
      screenReaderOptimized: z.boolean().default(false),
    })
    .default({}),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profiles = await prisma.studentProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = studentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { isDefault, ...data } = parsed.data;

  // If this is the default, unset others
  if (isDefault) {
    await prisma.studentProfile.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const profile = await prisma.studentProfile.create({
    data: { ...data, userId: user.id, isDefault },
  });

  return NextResponse.json(profile, { status: 201 });
}
