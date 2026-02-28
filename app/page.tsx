import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {/* Nav */}
      <nav className="flex h-[72px] items-center justify-between px-16 bg-[#F5F4F1]">
        <Link
          href="/"
          className="text-xl font-bold tracking-[-0.5px] text-[#1A1918]"
        >
          EveryMind
        </Link>

        <div className="flex items-center gap-10">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-[#6D6C6A] hover:text-[#1A1918] transition-colors"
          >
            How it works
          </a>
          <a
            href="#teachers"
            className="text-sm font-medium text-[#6D6C6A] hover:text-[#1A1918] transition-colors"
          >
            For Teachers
          </a>
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#6D6C6A] hover:text-[#1A1918] transition-colors"
            >
              Sign in
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#6D6C6A] hover:text-[#1A1918] transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/FlyingShuriken/everymind-ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-[#1A1918] text-white transition-opacity hover:opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <SignedOut>
            <Link
              href="/sign-up"
              className="flex items-center rounded-full bg-[#3D8A5A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center rounded-full bg-[#3D8A5A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Go to dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center bg-[#F5F4F1] px-8 pb-16 pt-20 text-center"
        style={{ minHeight: "560px" }}
      >
        <div className="mb-6 flex items-center rounded-full bg-[#C8F0D8] px-4 py-1.5">
          <span className="text-xs font-semibold text-[#3D8A5A]">
            AI-powered adaptive learning
          </span>
        </div>
        <h1 className="mb-6 max-w-2xl text-6xl font-bold leading-[1.05] tracking-tight text-[#1A1918]">
          Learning designed
          <br />
          around you.
        </h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-[#6D6C6A]">
          Upload any material and EveryMind generates personalised content
          across text, audio, visual, and interactive formats — for every
          learner.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-up"
            className="flex items-center rounded-full bg-[#3D8A5A] px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start learning for free
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center rounded-full border border-[#E5E4E1] bg-white px-7 py-3.5 text-sm font-semibold text-[#1A1918] transition-colors hover:bg-[#F5F4F1]"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white px-40 py-16">
        <h2 className="mb-12 text-[28px] font-bold text-[#1A1918]">
          How EveryMind works
        </h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            {
              num: "1",
              title: "Upload your material",
              desc: "Add a topic or upload a PDF or document. EveryMind reads and understands it.",
            },
            {
              num: "2",
              title: "Personalise for the learner",
              desc: "Select a student profile with specific needs, preferences, and accessibility settings.",
            },
            {
              num: "3",
              title: "Learn in your format",
              desc: "Access your content as structured text, visual summary, video, or interactive exercises.",
            },
          ].map((step) => (
            <div key={step.num} className="flex flex-col gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8F0D8]">
                <span className="text-sm font-bold text-[#3D8A5A]">
                  {step.num}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#1A1918]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6D6C6A]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* For Teachers section */}
      <section id="teachers" className="bg-[#F5F4F1] px-40 py-16">
        <div className="max-w-lg">
          <div className="mb-4 inline-flex items-center rounded-full bg-[#C8F0D8] px-4 py-1.5">
            <span className="text-xs font-semibold text-[#3D8A5A]">
              For educators
            </span>
          </div>
          <h2 className="mb-4 text-[28px] font-bold text-[#1A1918]">
            Built for teachers too
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[#6D6C6A]">
            Create student profiles with specific accessibility needs, then
            generate courses tailored to each group. Every student gets content
            designed for how they learn best.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-full bg-[#1A1918] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex h-16 items-center justify-between bg-[#F5F4F1] px-16">
        <span className="text-sm font-bold text-[#1A1918]">everymind</span>
        <span className="text-xs text-[#9C9B99]">
          © 2026 EveryMind. Designed for every mind.
        </span>
      </footer>
    </div>
  );
}
