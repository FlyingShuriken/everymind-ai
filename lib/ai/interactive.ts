import { genai, GEMINI_MODEL } from "./vertex";
import { parseAIJson } from "./parse-json";

export type ExerciseType = "fill-in-blank" | "multiple-choice" | "short-answer";

export interface Exercise {
  type: ExerciseType;
  question: string;
  /** For fill-in-blank: the sentence with ___ as the blank */
  sentence?: string;
  /** For multiple-choice: the answer choices */
  options?: string[];
  /** The correct answer (index for multiple-choice, string for others) */
  correctAnswer: string | number;
  hint?: string;
  explanation: string;
}

export interface InteractiveContent {
  sectionTitle: string;
  exercises: Exercise[];
}

export async function generateInteractiveExercises(
  sectionTitle: string,
  sectionBody: string,
  sectionSummary: string,
): Promise<InteractiveContent> {
  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Create 3 interactive exercises for the course section titled "${sectionTitle}".

SECTION CONTENT:
${sectionBody.slice(0, 2000)}

SECTION SUMMARY:
${sectionSummary}

Create a mix of exercise types: fill-in-blank, multiple-choice, and short-answer.
Exercises must test understanding of the actual content, not just recall.

Return JSON with this exact structure:
{
  "sectionTitle": "${sectionTitle}",
  "exercises": [
    {
      "type": "fill-in-blank",
      "question": "Complete the sentence:",
      "sentence": "The ___ is responsible for [concept] in [context].",
      "correctAnswer": "correct term",
      "hint": "Think about [related concept]",
      "explanation": "Because [brief explanation from section content]"
    },
    {
      "type": "multiple-choice",
      "question": "Which of the following best describes [concept]?",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0,
      "hint": "Look at the [part of content] subsection",
      "explanation": "Option A is correct because [reason from section]"
    },
    {
      "type": "short-answer",
      "question": "In your own words, explain [concept] and why it matters.",
      "correctAnswer": "Sample answer: [key points from section]",
      "explanation": "A good answer should include: [key points]"
    }
  ]
}

Respond with ONLY valid JSON. No markdown fences, no preamble.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You create engaging educational exercises that test understanding at multiple cognitive levels. All exercises must be grounded in the provided section content.",
      responseMimeType: "application/json",
    },
  });

  return parseAIJson<InteractiveContent>(response.text!);
}
