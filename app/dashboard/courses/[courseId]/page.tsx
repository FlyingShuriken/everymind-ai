"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CourseViewer } from "@/components/courses/course-viewer";
import { GenerationStatus } from "@/components/courses/generation-status";
import { Quiz } from "@/components/courses/quiz";

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  generationError: string | null;
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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        router.push("/dashboard/courses");
        return;
      }
      const data = await res.json();
      setCourse(data);
    } catch {
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
      // ignore
    } finally {
      setLoadingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p>Loading...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="mt-2 text-muted-foreground">{course.description}</p>
        )}
      </div>

      {course.status !== "READY" && (
        <GenerationStatus
          courseId={course.id}
          initialStatus={course.status}
          onReady={fetchCourse}
        />
      )}

      {course.status === "READY" && (
        <>
          <CourseViewer courseId={course.id} contents={course.contents} />

          <div className="mt-12 border-t pt-8">
            <h2 className="mb-4 text-2xl font-bold">Quiz</h2>
            {!showQuiz ? (
              <Button onClick={loadQuiz}>Take Quiz</Button>
            ) : loadingQuiz ? (
              <p aria-live="polite">Generating quiz...</p>
            ) : quiz ? (
              <Quiz courseId={course.id} questions={quiz.questions} />
            ) : (
              <p>Failed to load quiz.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
