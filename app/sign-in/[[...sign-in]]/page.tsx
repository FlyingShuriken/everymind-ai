import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F4F1]">
      <div className="px-16 py-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.5px] text-[#1A1918]"
        >
          EveryMind
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
