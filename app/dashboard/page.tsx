import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/users";
import { getLearningProfile } from "@/lib/db/learning-profiles";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    redirect("/onboarding");
  }

  const profile = await getLearningProfile(user.id);

  if (!profile?.completedAt) {
    redirect("/onboarding");
  }

  const disabilities = profile.disabilities as string[];
  const preferences = profile.preferences as string[];
  const a11y = profile.accessibilityNeeds as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">
        Welcome{user.name ? `, ${user.name}` : ""}!
      </h1>
      <p className="mb-8 text-muted-foreground">
        You&apos;re signed in as a <strong>{user.role?.toLowerCase()}</strong>. Your learning profile is set up.
      </p>

      <div className="mb-8 flex gap-3">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Your Courses
        </Link>
        {user.role === "TEACHER" && (
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Student Profiles
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Learning Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1">
              {disabilities.map((d) => (
                <li key={d} className="capitalize">{d.replace("-", " ")}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferred Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1">
              {preferences.map((p) => (
                <li key={p} className="capitalize">{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Accessibility Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Font Size</dt>
                <dd className="font-medium capitalize">{String(a11y.fontSize || "default")}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">High Contrast</dt>
                <dd className="font-medium">{a11y.highContrast ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Reduced Motion</dt>
                <dd className="font-medium">{a11y.reducedMotion ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Screen Reader Optimized</dt>
                <dd className="font-medium">{a11y.screenReaderOptimized ? "On" : "Off"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
