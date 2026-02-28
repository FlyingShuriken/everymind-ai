import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserByClerkId } from "@/lib/db/users";
import { getLearningProfile } from "@/lib/db/learning-profiles";
import { getCoursesByCreator } from "@/lib/db/courses";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  READY: { label: "Ready", bg: "bg-[#C8F0D8]", text: "text-[#3D8A5A]" },
  PROCESSING: { label: "Processing", bg: "bg-[#FEF3E2]", text: "text-[#D4A64A]" },
  DRAFT: { label: "Draft", bg: "bg-[#F5F4F1]", text: "text-[#9C9B99]" },
  ERROR: { label: "Error", bg: "bg-red-100", text: "text-red-600" },
};

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/onboarding");

  const profile = await getLearningProfile(user.id);
  if (!profile?.completedAt) redirect("/onboarding");

  const allCourses = await getCoursesByCreator(user.id).catch(() => []);
  const courses = allCourses.filter((c) => c.status !== "ERROR");
  const recentCourses = courses.slice(0, 3);
  const continueCourse = courses.find((c) => c.status === "READY") ?? null;

  const disabilities = profile.disabilities as string[];
  const preferences = profile.preferences as string[];
  const a11yRaw = profile.accessibilityNeeds as Record<string, unknown>;
  const a11y = {
    fontSize: String(a11yRaw.fontSize ?? "default"),
    highContrast: Boolean(a11yRaw.highContrast),
    reducedMotion: Boolean(a11yRaw.reducedMotion),
    screenReaderOptimized: Boolean(a11yRaw.screenReaderOptimized),
  };

  const firstName = user.name?.split(" ")[0] || "";
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ""}`;

  return (
    <div className="px-14 py-12">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#1A1918]">{greeting}</h1>
        <Link
          href="/dashboard/courses/new"
          className="flex items-center gap-2 rounded-full bg-[#3D8A5A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + New course
        </Link>
      </div>

      {/* Profile cards */}
      <div className="mb-8 flex gap-4">
        {/* Learning Needs */}
        <div className="flex-1 rounded-2xl bg-white p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
            Learning Needs
          </p>
          <div className="flex flex-wrap gap-2">
            {disabilities.length > 0 ? (
              disabilities.map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-[#EBF7F0] px-3 py-1 text-xs font-medium capitalize text-[#3D8A5A]"
                >
                  {d.replace(/-/g, " ")}
                </span>
              ))
            ) : (
              <span className="text-sm text-[#9C9B99]">None specified</span>
            )}
          </div>
        </div>

        {/* Preferred Formats */}
        <div className="flex-1 rounded-2xl bg-white p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
            Preferred Formats
          </p>
          <div className="flex flex-wrap gap-2">
            {preferences.length > 0 ? (
              preferences.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium capitalize text-[#6D6C6A]"
                >
                  {p}
                </span>
              ))
            ) : (
              <span className="text-sm text-[#9C9B99]">None specified</span>
            )}
          </div>
        </div>

        {/* Accessibility */}
        <div className="flex-1 rounded-2xl bg-white p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
            Accessibility
          </p>
          <div className="flex flex-wrap gap-2">
            {a11y.fontSize !== "default" && (
              <span className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium capitalize text-[#6D6C6A]">
                {a11y.fontSize} text
              </span>
            )}
            {a11y.highContrast && (
              <span className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium text-[#6D6C6A]">
                High contrast
              </span>
            )}
            {a11y.reducedMotion && (
              <span className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium text-[#6D6C6A]">
                Reduced motion
              </span>
            )}
            {a11y.screenReaderOptimized && (
              <span className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-medium text-[#6D6C6A]">
                Screen reader
              </span>
            )}
            {!a11y.highContrast && !a11y.reducedMotion && !a11y.screenReaderOptimized && (
              <span className="text-sm text-[#9C9B99]">Default settings</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      {recentCourses.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1918]">
              Recent courses
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-sm font-medium text-[#3D8A5A] hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {recentCourses.map((course) => {
              const cfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.DRAFT;
              return (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-6 transition-shadow hover:shadow-sm"
                >
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-base font-semibold leading-snug text-[#1A1918]">
                    {course.title}
                  </span>
                  {course.status === "PROCESSING" ? (
                    <span className="text-xs text-[#9C9B99]">
                      Generating your personalised content…
                    </span>
                  ) : course.status === "DRAFT" ? (
                    <span className="text-xs text-[#9C9B99]">
                      Not yet generated
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Learning */}
      {continueCourse && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[#1A1918]">
            Continue learning
          </h2>
          <div className="flex items-center gap-10 rounded-2xl bg-white p-8">
            <div className="flex flex-1 flex-col gap-3">
              <span className="w-fit rounded-full bg-[#C8F0D8] px-3 py-1 text-xs font-semibold text-[#2A6B45]">
                {continueCourse.description?.split(" ").slice(0, 1)[0] ?? "Course"}
              </span>
              <h3 className="text-xl font-bold text-[#1A1918]">
                {continueCourse.title}
              </h3>
              {continueCourse.description && (
                <p className="text-sm text-[#9C9B99]">{continueCourse.description}</p>
              )}
              <Link
                href={`/dashboard/courses/${continueCourse.id}`}
                className="mt-2 w-fit rounded-full bg-[#1A1918] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              >
                Resume →
              </Link>
            </div>
            <div className="flex h-48 w-[280px] flex-shrink-0 flex-col items-start justify-center rounded-2xl bg-[#EBF7F0] p-6">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#3D8A5A]">
                Ready to study
              </span>
              <span className="mt-2 text-sm text-[#5FAB78]">
                Tap Resume to continue
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E4E1] py-20 text-center">
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
      )}
    </div>
  );
}
