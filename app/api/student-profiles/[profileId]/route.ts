import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  disabilities: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  accessibilityNeeds: z
    .object({
      fontSize: z.string(),
      highContrast: z.boolean(),
      reducedMotion: z.boolean(),
      screenReaderOptimized: z.boolean(),
    })
    .optional(),
  outputModes: z.array(z.enum(["audio", "visual", "video", "interactive"])).optional(),
  isDefault: z.boolean().optional(),
});

async function getProfile(profileId: string, clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  return prisma.studentProfile.findFirst({ where: { id: profileId, userId: user.id } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await getProfile(profileId, userId);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { isDefault, ...data } = parsed.data;

  if (isDefault) {
    await prisma.studentProfile.updateMany({
      where: { userId: profile.userId },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.studentProfile.update({
    where: { id: profileId },
    data: { ...data, ...(isDefault !== undefined ? { isDefault } : {}) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;
  const profile = await getProfile(profileId, userId);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.studentProfile.delete({ where: { id: profileId } });
  return new NextResponse(null, { status: 204 });
}
