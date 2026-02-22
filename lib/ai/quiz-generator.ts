import { genai, GEMINI_MODEL } from "./vertex";
import { parseAIJson } from "./parse-json";

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export async function generateQuiz(
  courseTitle: string,
  sectionSummaries: string[],
): Promise<Quiz> {
  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Create a quiz for the course "${courseTitle}" based on these section summaries:

${sectionSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Return JSON with this exact structure:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Create 5-10 questions. Mix difficulty levels. Keep language clear and accessible.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You create educational quiz questions at different cognitive levels: recall, comprehension, and application. Respond with ONLY valid JSON, no markdown fences, no extra text.",
    },
  });

  return parseAIJson<Quiz>(response.text!);
}
