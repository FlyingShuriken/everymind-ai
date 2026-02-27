import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { upsertUserByClerkId, getUserByClerkId } from "@/lib/db/users";
import { getLearningProfile, upsertLearningProfile } from "@/lib/db/learning-profiles";
import { learningProfileSchema } from "@/lib/validators";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const learningProfile = await getLearningProfile(user.id);

  if (!learningProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    role: user.role,
    ...learningProfile,
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
  const user = await upsertUserByClerkId(clerkId, {
    create: { email: `${clerkId}@placeholder.com`, role },
    update: { role },
  });

  const profile = await upsertLearningProfile(user.id, {
    disabilities,
    preferences,
    accessibilityNeeds,
    completedAt: new Date(),
  });

  return NextResponse.json(profile, { status: 200 });
}
