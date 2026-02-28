import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/users";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    getUserByClerkId(clerkId),
  ]);

  const userName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "User";

  const isTeacher = dbUser?.role === "TEACHER";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F4F1]">
      <Sidebar userName={userName} isTeacher={isTeacher} />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto outline-none"
      >
        {children}
      </main>
    </div>
  );
}
