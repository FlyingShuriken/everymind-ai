import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getCoursesByCreator, createCourse } from "@/lib/db/courses";
import { getStudentProfileByIdAndUser } from "@/lib/db/student-profiles";
import { createCourseSchema } from "@/lib/validators";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const courses = await getCoursesByCreator(user.id);

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
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
    const profile = await getStudentProfileByIdAndUser(studentProfileId, user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  }

  const course = await createCourse({
    title,
    creatorId: user.id,
    studentProfileId: studentProfileId ?? null,
    sourceMaterials: JSON.stringify(
      sourceType === "upload"
        ? (fileUrls ?? []).map((url) => ({ type: "file", url }))
        : [{ type: "topic", text: topic }],
    ),
  });

  return NextResponse.json(course, { status: 201 });
}
