"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ExerciseType = "fill-in-blank" | "multiple-choice" | "short-answer";

interface Exercise {
  type: ExerciseType;
  question: string;
  sentence?: string;
  options?: string[];
  correctAnswer: string | number;
  hint?: string;
  explanation: string;
}

interface InteractiveExercisesProps {
  sectionTitle: string;
  exercises: Exercise[];
}

function FillInBlank({ exercise, index }: { exercise: Exercise; index: number }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect =
    submitted && answer.trim().toLowerCase() === String(exercise.correctAnswer).toLowerCase();

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Exercise {index + 1} — Fill in the blank
      </p>
      <p className="mb-3 font-medium">{exercise.question}</p>
      {exercise.sentence && (
        <p className="mb-3 rounded bg-muted px-3 py-2 text-sm">{exercise.sentence}</p>
      )}
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={submitted}
        className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Your answer..."
        aria-label={`Answer for exercise ${index + 1}`}
      />
      {exercise.hint && showHint && (
        <p className="mb-2 text-sm text-amber-700">Hint: {exercise.hint}</p>
      )}
      <div className="flex gap-2">
        {!submitted && (
          <>
            <Button size="sm" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
              Check Answer
            </Button>
            {exercise.hint && !showHint && (
              <Button size="sm" variant="outline" onClick={() => setShowHint(true)}>
                Hint
              </Button>
            )}
          </>
        )}
        {submitted && (
          <p
            className={`text-sm font-medium ${isCorrect ? "text-green-700" : "text-red-600"}`}
            role="status"
          >
            {isCorrect ? "Correct!" : `Incorrect. Correct answer: ${exercise.correctAnswer}`}
          </p>
        )}
      </div>
      {submitted && (
        <p className="mt-2 text-sm text-muted-foreground">{exercise.explanation}</p>
      )}
    </div>
  );
}

function MultipleChoice({ exercise, index }: { exercise: Exercise; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = Number(exercise.correctAnswer);
  const isCorrect = submitted && selected === correct;

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Exercise {index + 1} — Multiple choice
      </p>
      <p className="mb-3 font-medium">{exercise.question}</p>
      <fieldset className="mb-3 space-y-2">
        <legend className="sr-only">Choose an answer</legend>
        {exercise.options?.map((option, oi) => (
          <label key={oi} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`mc-${index}`}
              value={oi}
              checked={selected === oi}
              onChange={() => setSelected(oi)}
              disabled={submitted}
            />
            <span
              className={
                submitted
                  ? oi === correct
                    ? "text-green-700 font-medium"
                    : selected === oi
                      ? "text-red-600"
                      : ""
                  : ""
              }
            >
              {option}
            </span>
          </label>
        ))}
      </fieldset>
      {!submitted && (
        <Button
          size="sm"
          onClick={() => setSubmitted(true)}
          disabled={selected === null}
        >
          Check Answer
        </Button>
      )}
      {submitted && (
        <>
          <p
            className={`text-sm font-medium ${isCorrect ? "text-green-700" : "text-red-600"}`}
            role="status"
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{exercise.explanation}</p>
        </>
      )}
    </div>
  );
}

function ShortAnswer({ exercise, index }: { exercise: Exercise; index: number }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Exercise {index + 1} — Short answer
      </p>
      <p className="mb-3 font-medium">{exercise.question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Write your answer here..."
        aria-label={`Short answer for exercise ${index + 1}`}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRevealed(true)}
        disabled={revealed}
      >
        {revealed ? "Sample answer shown" : "Show sample answer"}
      </Button>
      {revealed && (
        <div className="mt-3 rounded bg-muted p-3 text-sm">
          <p className="font-medium">Sample answer:</p>
          <p className="mt-1 text-muted-foreground">{exercise.correctAnswer}</p>
          <p className="mt-2 text-muted-foreground">{exercise.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function InteractiveExercises({ sectionTitle, exercises }: InteractiveExercisesProps) {
  if (exercises.length === 0) return null;

  return (
    <section aria-label={`Exercises for ${sectionTitle}`} className="space-y-4">
      <h3 className="font-medium">Practice Exercises</h3>
      {exercises.map((exercise, i) => {
        if (exercise.type === "fill-in-blank") {
          return <FillInBlank key={i} exercise={exercise} index={i} />;
        }
        if (exercise.type === "multiple-choice") {
          return <MultipleChoice key={i} exercise={exercise} index={i} />;
        }
        return <ShortAnswer key={i} exercise={exercise} index={i} />;
      })}
    </section>
  );
}
