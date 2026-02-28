"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewCourseForm } from "@/components/courses/new-course-form";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    fetch("/api/learning-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role === "TEACHER") setIsTeacher(true);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (data: {
    title: string;
    sourceType: "upload" | "topic";
    topic?: string;
    fileUrls?: string[];
    studentProfileId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
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

      const genRes = await fetch(`/api/courses/${course.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        console.error("Generation failed");
      }

      router.push(`/dashboard/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="px-14 py-12">
      <p className="mb-2 text-sm text-[#9C9B99]">
        <Link
          href="/dashboard/courses"
          className="hover:text-[#1A1918] transition-colors"
        >
          ← Back to courses
        </Link>
      </p>
      <h1 className="mb-10 text-[28px] font-bold text-[#1A1918]">
        Create a new course
      </h1>

      {error && (
        <p role="alert" className="mb-6 text-sm text-red-600">
          {error}
        </p>
      )}

      <NewCourseForm
        onSubmit={handleSubmit}
        loading={loading}
        isTeacher={isTeacher}
      />
    </div>
  );
}
