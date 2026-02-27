import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getStudentProfiles, createStudentProfile } from "@/lib/db/student-profiles";
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
    .default({ fontSize: "medium", highContrast: false, reducedMotion: false, screenReaderOptimized: false }),
  outputModes: z.array(z.enum(["audio", "visual", "video", "interactive"])).default([]),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profiles = await getStudentProfiles(user.id);

  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = studentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await createStudentProfile(user.id, parsed.data);

  return NextResponse.json(profile, { status: 201 });
}
