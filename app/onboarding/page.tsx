import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-[#F5F4F1]">
      <div className="px-16 py-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.5px] text-[#1A1918]"
        >
          everymind
        </Link>
      </div>
      <div className="flex items-center justify-center px-4 pb-16">
        <AssessmentWizard />
      </div>
    </div>
  );
}
