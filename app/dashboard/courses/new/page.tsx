"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadForm } from "@/components/courses/upload-form";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    title: string;
    sourceType: "upload" | "topic";
    topic?: string;
    fileUrls?: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Create course
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create course");
      }

      const course = await res.json();

      // Trigger generation
      const genRes = await fetch(`/api/courses/${course.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        // Course created but generation failed — still navigate
        console.error("Generation failed");
      }

      router.push(`/dashboard/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Create New Course</h1>
      <p className="mb-8 text-muted-foreground">
        Upload a document or enter a topic to generate an accessible course.
      </p>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <UploadForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
