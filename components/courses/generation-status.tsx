"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";

interface GenerationStatusProps {
  courseId: string;
  initialStatus: string;
  onReady: () => void;
  isCreator?: boolean;
}

export function GenerationStatus({
  courseId,
  initialStatus,
  onReady,
  isCreator,
}: GenerationStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const pollFailures = useRef(0);

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) return;
        pollFailures.current = 0;
        const course = await res.json();
        setStatus(course.status);
        if (course.status === "READY") {
          clearInterval(interval);
          onReady();
        } else if (course.status === "ERROR") {
          clearInterval(interval);
          setError(course.generationError || "Generation failed");
        }
      } catch {
        pollFailures.current++;
        if (pollFailures.current >= 5) {
          clearInterval(interval);
          toast.error("Lost connection while checking generation status. Please refresh the page.");
          setError("Connection lost. Please refresh the page.");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [courseId, status, onReady]);

  if (status === "READY") return null;

  return (
    <div aria-live="polite" className="space-y-2">
      {status === "PROCESSING" && (
        <>
          <p className="text-sm font-medium">Generating course content...</p>
          <progress className="w-full" />
          <p className="text-xs text-muted-foreground">
            This may take a minute. The page will update automatically.
          </p>
        </>
      )}
      {status === "ERROR" && (
        <p role="alert" className="text-sm text-red-600">
          {error || "An error occurred during generation."}
        </p>
      )}
      {status === "DRAFT" && (
        <p className="text-sm text-muted-foreground">
          {isCreator
            ? "Course is in draft. Click \"Generate\" to create content."
            : "This course is being prepared. Check back with the teacher once it\u2019s ready."}
        </p>
      )}
    </div>
  );
}
