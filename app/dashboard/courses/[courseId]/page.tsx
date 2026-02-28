"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CourseViewer } from "@/components/courses/course-viewer";
import { GenerationStatus } from "@/components/courses/generation-status";
import { Quiz } from "@/components/courses/quiz";

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  generationError: string | null;
  isCreator: boolean;
  contents: Array<{
    id: string;
    contentType: string;
    contentData: string;
    metadata: string;
    orderIndex: number;
  }>;
}

interface QuizData {
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

type ProgressMap = Record<
  string,
  { completed: boolean; timeSpent: number; performanceData: unknown }
>;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  READY: { label: "Ready", bg: "bg-[#C8F0D8]", text: "text-[#3D8A5A]" },
  PROCESSING: { label: "Processing", bg: "bg-[#FEF3E2]", text: "text-[#D4A64A]" },
  DRAFT: { label: "Draft", bg: "bg-[#F5F4F1]", text: "text-[#9C9B99]" },
  ERROR: { label: "Error", bg: "bg-red-100", text: "text-red-600" },
};

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});

  const fetchCourse = useCallback(async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/progress`),
      ]);
      if (!courseRes.ok) {
        router.push("/dashboard/courses");
        return;
      }
      const data = await courseRes.json();
      setCourse(data);
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }
    } catch {
      toast.error("Failed to load course. Redirecting...");
      router.push("/dashboard/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const loadQuiz = async () => {
    setLoadingQuiz(true);
    setShowQuiz(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/quiz`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      }
    } catch {
      toast.error("Failed to load quiz. Please try again.");
      setQuiz(null);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSectionComplete = useCallback(
    async (contentId: string) => {
      setProgress((prev) => ({
        ...prev,
        [contentId]: { completed: true, timeSpent: 0, performanceData: null },
      }));
      try {
        const res = await fetch(`/api/courses/${courseId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId, completed: true }),
        });
        if (!res.ok) throw new Error();
      } catch {
        toast.error("Failed to save progress.");
      }
    },
    [courseId]
  );

  if (loading) {
    return (
      <div
        role="region"
        aria-label="Loading course"
        aria-busy="true"
        className="px-14 py-10"
      >
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Skeleton className="mb-8 h-1 w-full" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="w-80 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const textSections = course.contents.filter((c) => c.contentType === "TEXT");
  const completedCount = textSections.filter(
    (c) => progress[c.id]?.completed
  ).length;
  const totalSections = textSections.length;
  const progressPercent =
    totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  const cfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.DRAFT;

  // Derive key terms from the first text section
  const firstTextSection =
    textSections.length > 0
      ? (() => {
          try {
            return JSON.parse(textSections[0].contentData) as {
              title: string;
              keyTerms?: { term: string; definition: string }[];
            };
          } catch {
            return null;
          }
        })()
      : null;
  const keyTerms = firstTextSection?.keyTerms?.slice(0, 3) ?? [];

  // Section titles for TOC
  const sectionTitles = textSections.slice(0, 5).map((c) => {
    try {
      return (JSON.parse(c.contentData) as { title: string }).title;
    } catch {
      return "";
    }
  });

  return (
    <div className="px-14 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2">
        <Link
          href="/dashboard/courses"
          className="text-sm text-[#9C9B99] hover:text-[#6D6C6A] transition-colors"
        >
          My Courses
        </Link>
        <span className="text-sm text-[#D1D0CD]">›</span>
        <span className="text-sm font-medium text-[#1A1918] line-clamp-1">
          {course.title}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-bold text-[#1A1918]">{course.title}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
          </div>
        </div>
        {course.status === "READY" && (
          <button
            onClick={loadQuiz}
            className="flex-shrink-0 rounded-full bg-[#1A1918] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          >
            Take quiz
          </button>
        )}
      </div>

      {/* Progress bar */}
      {course.status === "READY" && totalSections > 0 && (
        <div className="mb-5 flex flex-col gap-1.5">
          <span className="text-xs text-[#9C9B99]">{progressPercent}% complete</span>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-[#E5E4E1]"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <div
              className="h-full rounded-full bg-[#3D8A5A] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Not ready */}
      {course.status !== "READY" && (
        <div className="mt-4">
          <GenerationStatus
            courseId={course.id}
            initialStatus={course.status}
            onReady={fetchCourse}
            isCreator={course.isCreator}
          />
        </div>
      )}

      {/* Ready — tabs + content */}
      {course.status === "READY" && (
        <div className="flex gap-8">
          {/* Left — course content */}
          <div className="min-w-0 flex-1">
            <CourseViewer
              courseId={course.id}
              contents={course.contents}
              progress={progress}
              onSectionComplete={handleSectionComplete}
            />

            {/* Quiz section */}
            {showQuiz && (
              <div className="mt-10 rounded-2xl bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-[#1A1918]">Quiz</h2>
                {loadingQuiz ? (
                  <p aria-live="polite" className="text-sm text-[#9C9B99]">
                    Generating quiz…
                  </p>
                ) : quiz ? (
                  <Quiz courseId={course.id} questions={quiz.questions} />
                ) : (
                  <p role="alert" className="text-sm text-red-600">
                    Failed to load quiz. Please try again later.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right panel */}
          <aside className="flex w-80 flex-shrink-0 flex-col gap-4">
            {/* TOC */}
            {sectionTitles.length > 0 && (
              <div className="rounded-2xl bg-white p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
                  On this page
                </p>
                <div className="flex flex-col gap-1">
                  {sectionTitles.map((title, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                        i === 0 ? "bg-[#EBF7F0]" : ""
                      }`}
                    >
                      <span
                        className={`h-3.5 w-0.5 flex-shrink-0 rounded-full ${
                          i === 0 ? "bg-[#3D8A5A]" : "bg-[#E5E4E1]"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          i === 0
                            ? "font-semibold text-[#3D8A5A]"
                            : "text-[#6D6C6A]"
                        }`}
                      >
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress card */}
            {totalSections > 0 && (
              <div className="rounded-2xl bg-[#3D8A5A] p-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#C8F0D8]">
                  Your Progress
                </p>
                <p className="mb-1 text-4xl font-bold text-white">
                  {progressPercent}%
                </p>
                <p className="mb-4 text-sm text-[#C8F0D8]">
                  {completedCount} of {totalSections} sections complete
                </p>
                <div
                  className="h-1 w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Key terms */}
            {keyTerms.length > 0 && (
              <div className="rounded-2xl bg-white p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
                  Key Terms
                </p>
                <div className="flex flex-col gap-2">
                  {keyTerms.map((kt) => (
                    <div
                      key={kt.term}
                      className="flex flex-col gap-0.5 rounded-lg bg-[#F5F4F1] px-3 py-2.5"
                    >
                      <span className="text-sm font-semibold text-[#1A1918]">
                        {kt.term}
                      </span>
                      <span className="text-xs text-[#6D6C6A]">
                        {kt.definition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
