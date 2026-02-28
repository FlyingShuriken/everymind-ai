import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserByClerkId } from "@/lib/db/users";
import { getCoursesByCreator } from "@/lib/db/courses";
import { CourseCard } from "@/components/courses/course-card";

export default async function CoursesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const courses = await getCoursesByCreator(user.id);

  return (
    <div className="px-14 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#1A1918]">My Courses</h1>
        <Link
          href="/dashboard/courses/new"
          className="flex items-center gap-2 rounded-full bg-[#3D8A5A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + New course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E4E1] py-24 text-center">
          <h3 className="mb-2 text-lg font-semibold text-[#1A1918]">
            No courses yet
          </h3>
          <p className="mb-6 text-sm text-[#9C9B99]">
            Create your first course to get started
          </p>
          <Link
            href="/dashboard/courses/new"
            className="rounded-full bg-[#3D8A5A] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Create a course
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
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
