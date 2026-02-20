import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { learningProfileSchema } from "@/lib/validators";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { learningProfile: true },
  });

  if (!user || !user.learningProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    role: user.role,
    ...user.learningProfile,
  });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = learningProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { role, disabilities, preferences, accessibilityNeeds } = result.data;

  // Upsert user in case webhook hasn't fired yet
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { role },
    create: { clerkId, email: `${clerkId}@placeholder.com`, role },
  });

  const profile = await prisma.learningProfile.upsert({
    where: { userId: user.id },
    update: {
      disabilities,
      preferences,
      accessibilityNeeds,
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      disabilities,
      preferences,
      accessibilityNeeds,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(profile, { status: 200 });
}
