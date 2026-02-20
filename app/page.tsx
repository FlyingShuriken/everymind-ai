import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="mb-6 text-5xl font-bold tracking-tight">
        EveryMind.ai
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
        An AI-powered, accessibility-first educational platform designed for
        students with disabilities and diverse learning preferences. Upload
        materials, and we generate personalized courses in the formats that
        work best for you.
      </p>
      <div className="flex justify-center gap-4">
        <Button size="lg" asChild>
          <Link href="/sign-up">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>

      <section className="mt-24">
        <h2 className="mb-12 text-3xl font-bold">How it works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xl font-semibold">1. Tell us about yourself</h3>
            <p className="text-muted-foreground">
              Complete a quick assessment so we understand your learning needs and preferences.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">2. Upload your materials</h3>
            <p className="text-muted-foreground">
              Share PDFs, documents, or just a topic — our AI handles the rest.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">3. Learn in your format</h3>
            <p className="text-muted-foreground">
              Get personalized courses in text, audio, visual, or interactive formats.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
