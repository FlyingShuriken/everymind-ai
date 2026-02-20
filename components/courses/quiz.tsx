"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizResult {
  questionIndex: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

interface QuizProps {
  courseId: string;
  questions: QuizQuestion[];
}

export function Quiz({ courseId, questions }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(answers).length < questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([qi, si]) => ({
            questionIndex: Number(qi),
            selectedIndex: si,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      const data = await res.json();
      setResults(data.results);
      setScore({ correct: data.correct, total: data.total });
    } catch {
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {score && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-muted p-4"
        >
          <p className="text-lg font-medium">
            Score: {score.correct} / {score.total} (
            {Math.round((score.correct / score.total) * 100)}%)
          </p>
        </div>
      )}

      {questions.map((q, qi) => {
        const result = results?.find((r) => r.questionIndex === qi);
        return (
          <fieldset key={qi} className="space-y-3">
            <legend className="text-sm font-medium">
              {qi + 1}. {q.question}
            </legend>
            <div className="space-y-2 pl-4">
              {q.options.map((option, oi) => (
                <label
                  key={oi}
                  className={`flex items-start gap-2 rounded-md p-2 text-sm ${
                    result
                      ? oi === q.correctIndex
                        ? "bg-green-50"
                        : oi === answers[qi] && !result.correct
                          ? "bg-red-50"
                          : ""
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [qi]: oi }))
                    }
                    disabled={!!results}
                    className="mt-0.5"
                  />
                  {option}
                </label>
              ))}
            </div>
            {result && (
              <p
                className={`pl-4 text-sm ${result.correct ? "text-green-700" : "text-red-700"}`}
              >
                {result.correct ? "Correct!" : "Incorrect."}{" "}
                {q.explanation}
              </p>
            )}
          </fieldset>
        );
      })}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!results && (
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      )}
    </form>
  );
}
