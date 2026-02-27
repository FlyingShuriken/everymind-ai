import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserByClerkId } from "@/lib/db/users";
import { getCoursesByCreator } from "@/lib/db/courses";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";

export default async function CoursesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const courses = await getCoursesByCreator(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Courses</h1>
        <Button asChild>
          <Link href="/dashboard/courses/new">New Course</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <p className="text-muted-foreground">
          No courses yet. Create your first course to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              status={course.status}
              createdAt={course.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
