import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          EveryMind.ai
        </Link>
        <nav aria-label="Main navigation">
          <SignedOut>
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/courses"
                className="text-sm font-medium hover:underline"
              >
                Courses
              </Link>
              <UserButton />
            </div>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
