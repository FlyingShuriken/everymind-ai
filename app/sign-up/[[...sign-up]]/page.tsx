import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F4F1]">
      <div className="px-16 py-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.5px] text-[#1A1918]"
        >
          everymind
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <SignUp />
      </div>
    </div>
  );
}
