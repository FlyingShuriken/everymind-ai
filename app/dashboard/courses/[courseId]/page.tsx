"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [copied, setCopied] = useState(false);

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
    [courseId],
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  if (loading) {
    return (
      <div
        role="region"
        aria-label="Loading course"
        aria-busy="true"
        className="mx-auto max-w-4xl px-4 py-12"
      >
        <h1 className="sr-only">Loading course</h1>
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Skeleton className="mb-8 h-4 w-1/2" />
        <Skeleton className="mb-8 h-2 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const textSections = course.contents.filter((c) => c.contentType === "TEXT");
  const completedCount = textSections.filter(
    (c) => progress[c.id]?.completed,
  ).length;
  const totalSections = textSections.length;
  const progressPercent =
    totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/dashboard/courses" className="text-sm text-muted-foreground hover:underline">
          ← Courses
        </Link>
      </nav>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="mt-2 text-muted-foreground">{course.description}</p>
            )}
          </div>
          {course.isCreator && course.status === "READY" && (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? "Copied!" : "Copy share link"}
            </Button>
          )}
        </div>

        {course.status === "READY" && totalSections > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {completedCount} of {totalSections} sections completed
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {course.status !== "READY" && (
        <GenerationStatus
          courseId={course.id}
          initialStatus={course.status}
          onReady={fetchCourse}
          isCreator={course.isCreator}
        />
      )}

      {course.status === "READY" && (
        <>
          <CourseViewer
            courseId={course.id}
            contents={course.contents}
            progress={progress}
            onSectionComplete={handleSectionComplete}
          />

          <div className="mt-12 border-t pt-8">
            <h2 className="mb-4 text-2xl font-bold">Quiz</h2>
            {!showQuiz ? (
              <Button onClick={loadQuiz}>Take Quiz</Button>
            ) : loadingQuiz ? (
              <p aria-live="polite">Generating quiz...</p>
            ) : quiz ? (
              <Quiz courseId={course.id} questions={quiz.questions} />
            ) : (
              <p role="alert" className="text-sm text-destructive">
                Failed to load quiz. Please try again later.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
