import { openai, MODEL } from "./openai";

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

export async function generateOutline(
  input: string,
  isUpload: boolean,
): Promise<CourseOutline> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an educational content designer following Universal Design for Learning (UDL) principles. Output valid JSON only.",
      },
      {
        role: "user",
        content: `Create a course outline from the following ${isUpload ? "learning material" : "topic"}.

${isUpload ? "Material:" : "Topic:"} ${input.slice(0, 12000)}

Return JSON with this exact structure:
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

Create 4-8 sections. Make content accessible and clear.`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as CourseOutline;
}

export async function generateSection(
  courseTitle: string,
  section: SectionOutline,
): Promise<SectionContent> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an educational content writer. Write clear, accessible content: short paragraphs, simple sentences, define all terms. Target an 8th-grade reading level. Output valid JSON only.",
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

  return JSON.parse(response.choices[0].message.content!) as SectionContent;
}

export async function generateCourse(
  input: string,
  isUpload: boolean,
): Promise<{ outline: CourseOutline; sections: SectionContent[] }> {
  const outline = await generateOutline(input, isUpload);

  const sections: SectionContent[] = [];
  for (const section of outline.sections) {
    const content = await generateSection(outline.title, section);
    sections.push(content);
  }

  return { outline, sections };
}
