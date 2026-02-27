import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getCourse } from "@/lib/db/courses";
import { getCourseContents } from "@/lib/db/course-contents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const course = await getCourse(courseId);

  if (!course || course.creatorId !== user.id) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const contents = await getCourseContents(courseId);

  return NextResponse.json(contents);
}
