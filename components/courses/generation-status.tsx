"use client";

import { useEffect, useState } from "react";

interface GenerationStatusProps {
  courseId: string;
  initialStatus: string;
  onReady: () => void;
}

export function GenerationStatus({
  courseId,
  initialStatus,
  onReady,
}: GenerationStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) return;
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
        // Ignore polling errors
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
          Course is in draft. Click &quot;Generate&quot; to create content.
        </p>
      )}
    </div>
  );
}
