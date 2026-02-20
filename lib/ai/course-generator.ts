import { openai, MODEL } from "./openai";
import { parseAIJson } from "./parse-json";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

interface SectionOutline {
  title: string;
  learningObjective: string;
  keyPoints: string[];
}

interface CourseOutline {
  title: string;
  description: string;
  sections: SectionOutline[];
}

interface SectionContent {
  title: string;
  body: string;
  summary: string;
  keyTerms: { term: string; definition: string }[];
}

export interface CourseInput {
  text?: string;
  images?: string[]; // base64 data URLs
}

const OUTLINE_PROMPT = `Return JSON with this exact structure:
{
  "title": "Course title",
  "description": "1-2 sentence course description",
  "sections": [
    {
      "title": "Section title",
      "learningObjective": "What the student will learn",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}

Create 4-8 sections. Make content accessible and clear.`;

export async function generateOutline(
  input: CourseInput,
): Promise<CourseOutline> {
  const userContent: ChatCompletionContentPart[] = [];

  if (input.images?.length) {
    userContent.push({
      type: "text",
      text: "Create a course outline from the following learning material pages:",
    });
    for (const dataUrl of input.images) {
      userContent.push({
        type: "image_url",
        image_url: { url: dataUrl, detail: "auto" },
      });
    }
    userContent.push({ type: "text", text: OUTLINE_PROMPT });
  } else {
    userContent.push({
      type: "text",
      text: `Create a course outline from the following topic.\n\nTopic: ${input.text?.slice(0, 12000)}\n\n${OUTLINE_PROMPT}`,
    });
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an educational content designer following Universal Design for Learning (UDL) principles. Respond with ONLY valid JSON, no markdown fences, no extra text.",
      },
      { role: "user", content: userContent },
    ],
  });

  return parseAIJson<CourseOutline>(response.choices[0].message.content!);
}

export async function generateSection(
  courseTitle: string,
  section: SectionOutline,
): Promise<SectionContent> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an educational content writer. Write clear, accessible content: short paragraphs, simple sentences, define all terms. Target an 8th-grade reading level. Respond with ONLY valid JSON, no markdown fences, no extra text.",
      },
      {
        role: "user",
        content: `Write content for a section of the course "${courseTitle}".

Section: ${section.title}
Learning Objective: ${section.learningObjective}
Key Points: ${section.keyPoints.join(", ")}

Return JSON with this exact structure:
{
  "title": "Section title",
  "body": "Full section content in markdown (use ## for subsections, **bold** for key terms, - for lists)",
  "summary": "2-3 sentence summary of this section",
  "keyTerms": [{"term": "word", "definition": "meaning"}]
}`,
      },
    ],
  });

  return parseAIJson<SectionContent>(response.choices[0].message.content!);
}

export async function generateCourse(
  input: CourseInput,
): Promise<{ outline: CourseOutline; sections: SectionContent[] }> {
  const outline = await generateOutline(input);

  const sections: SectionContent[] = [];
  for (const section of outline.sections) {
    const content = await generateSection(outline.title, section);
    sections.push(content);
  }

  return { outline, sections };
}
