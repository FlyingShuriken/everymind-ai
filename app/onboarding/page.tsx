import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/users";
import { getLearningProfile } from "@/lib/db/learning-profiles";
import { AssessmentWizard } from "@/components/onboarding/assessment-wizard";

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);

  if (user) {
    const learningProfile = await getLearningProfile(user.id);
    if (learningProfile?.completedAt) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Set up your learning profile
      </h1>
      <p className="mb-8 text-center text-muted-foreground">
        Help us understand how you learn best. This takes about 2 minutes.
      </p>
      <AssessmentWizard />
    </div>
  );
}
