import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getStudentProfileByIdAndUser, updateStudentProfile, deleteStudentProfile } from "@/lib/db/student-profiles";
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

export async function PATCH(req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;

  const user = await getUserByClerkId(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await updateStudentProfile(profileId, user.id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await params;

  const user = await getUserByClerkId(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = await getStudentProfileByIdAndUser(profileId, user.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteStudentProfile(profileId);
  return new NextResponse(null, { status: 204 });
}
