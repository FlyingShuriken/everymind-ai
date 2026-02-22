import { genai, GEMINI_MODEL } from "./vertex";
import { parseAIJson } from "./parse-json";
import type { PageChunk } from "@/lib/documents/extract";

interface SectionOutline {
  title: string;
  learningObjective: string;
  keyPoints: string[];
  relevantContent?: string;
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

export interface StudentProfileInput {
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
}

export interface CourseInput {
  text?: string;
  images?: string[]; // legacy — kept for type compat, not used by new pipeline
  chunks?: PageChunk[]; // legacy single-file flat list
  filePdfs?: PageChunk[][]; // new: per-file chunk arrays (hierarchical pipeline)
  studentProfile?: StudentProfileInput;
}

function buildStudentContextInstructions(profile: StudentProfileInput): string {
  const lines: string[] = [];

  const disabilityMap: Record<string, string> = {
    "deaf": "Avoid language that assumes hearing (e.g. 'listen to...'). Provide full text for any audio content. Prefer text and visual formats.",
    "hard-of-hearing": "Avoid language that assumes hearing. Provide text alternatives. Prefer text and visual formats.",
    "blind": "Do not reference visual elements without describing them fully in text. Avoid phrases like 'see the diagram above'. Describe all concepts in words.",
    "low-vision": "Use high-contrast text descriptions. Avoid relying on color alone to convey meaning.",
    "adhd": "Use very short paragraphs (2–3 sentences max). Add a '## Quick Check' callout after every major concept. Use bullet points liberally.",
    "dyslexia": "Use short sentences. Break content into small, clearly labeled chunks. Avoid long dense paragraphs.",
    "autism-spectrum": "Be explicit and literal. Avoid idioms or ambiguous language. Clearly label sections and transitions.",
    "cognitive-disability": "Use simple vocabulary. Define every technical term immediately. Repeat key ideas in the summary.",
  };

  const preferenceMap: Record<string, string> = {
    "audio": "Note where content would be well-suited for listening; suggest students listen along.",
    "visual": "Include rich descriptions of any diagrams or charts. Suggest visual analogies.",
    "interactive": "Embed 1–2 reflection questions or exercises per section under a '## Practice' subheading.",
  };

  for (const disability of profile.disabilities) {
    const instruction = disabilityMap[disability.toLowerCase()];
    if (instruction) lines.push(instruction);
  }

  for (const pref of profile.preferences) {
    const instruction = preferenceMap[pref.toLowerCase()];
    if (instruction) lines.push(instruction);
  }

  if (profile.accessibilityNeeds.screenReaderOptimized) {
    lines.push("Use clear heading hierarchy. Avoid ASCII art or symbol-heavy formatting.");
  }

  if (lines.length === 0) return "";
  return "\n\nStudent Accessibility Requirements:\n" + lines.map((l) => `- ${l}`).join("\n");
}

// --- Concurrency helper ---

export async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// --- Pass 1: Summarize a chunk of PDF pages ---

async function summarizeChunk(chunk: PageChunk): Promise<string> {
  const start = chunk.chunkIndex * chunk.pages.length + 1;
  const end = start + chunk.pages.length - 1;

  console.log(
    `[course-generator] Summarizing chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (pages ${start}–${end})`,
  );

  const systemPrompt = `You are a senior academic content analyst with 15+ years of experience extracting structured knowledge from educational materials across STEM, humanities, and professional domains.

Your extractions are used downstream to generate complete courses, so completeness and precision are critical. Never paraphrase where quoting a definition or formula is more accurate. Never omit data, figures, or examples — they are often the most teachable content.`;

  const userText = `You are analyzing pages ${start}–${end} of ${chunk.totalChunks * chunk.pages.length} total pages. This is chunk ${chunk.chunkIndex + 1} of ${chunk.totalChunks}.

Think through each page carefully before writing your extraction:

Step 1 — Identify the page type (e.g., title/intro, concept explanation, worked example, diagram, data table, summary, exercise).
Step 2 — For each page, extract ALL of the following that are present:
  • Main topic and how it connects to the overall subject
  • Definitions: exact term + definition (quote if possible)
  • Key concepts and the relationships between them
  • Facts, statistics, data points (include units and sources if shown)
  • Worked examples or case studies (describe the setup and outcome)
  • Visual content: describe diagrams, charts, graphs, and what they show
  • Learning objectives or explicitly stated goals
  • Formulas, algorithms, or step-by-step procedures (preserve notation)
Step 3 — Write a dense, well-organized prose summary grouped by topic. Use clear headings. Do not truncate or generalize — if the page covers five distinct points, document all five.

A good extraction looks like this:
---
## [Topic Name]
This section introduces [concept], defined as [exact definition]. It explains that [key relationship or mechanism]. For example, [description of example from page]. The diagram on this page shows [description and key takeaway]. The key formula presented is [formula].
---

Now extract pages ${start}–${end}:`;

  const imageParts = chunk.pages.map((dataUrl) => {
    // dataUrl is like "data:image/png;base64,..."
    const [header, data] = dataUrl.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "") as "image/png" | "image/jpeg";
    return { inlineData: { mimeType, data } };
  });

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: userText }, ...imageParts],
      },
    ],
    config: { systemInstruction: systemPrompt },
  });

  return response.text ?? "";
}

// --- Pass 1b: Collapse chunk summaries into one file-level summary ---

async function summarizeFile(
  fileIndex: number,
  totalFiles: number,
  chunkSummaries: string[],
): Promise<string> {
  console.log(
    `[course-generator] Collapsing ${chunkSummaries.length} chunk summaries for file ${fileIndex + 1}/${totalFiles}`,
  );

  const combined = chunkSummaries
    .map((s, i) => `=== CHUNK ${i + 1} OF ${chunkSummaries.length} ===\n${s}`)
    .join("\n\n");

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You have received summaries of each section of document ${fileIndex + 1} of ${totalFiles}. Synthesize them into a single comprehensive summary preserving all topics, definitions, formulas, and examples. Maintain document structure (intro → core → conclusion). Use clear ## headings for each major topic.

${combined}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: `You are a senior academic content analyst. You synthesize section-level summaries into one comprehensive document summary that preserves all topics, definitions, formulas, and examples. Your output will be used to generate a course outline.`,
    },
  });

  return response.text ?? combined;
}

// --- Pass 2a: Generate outline from summaries ---

async function generateOutlineFromSummaries(
  summaries: string[],
  studentProfile?: StudentProfileInput,
): Promise<CourseOutline> {
  const combinedContext = summaries
    .map((s, i) => `=== PART ${i + 1} OF ${summaries.length} ===\n${s}`)
    .join("\n\n");

  console.log(
    `[course-generator] Generating outline from ${summaries.length} summaries`,
  );

  const systemPrompt = `You are a lead curriculum designer with expertise in Universal Design for Learning (UDL), Bloom's Taxonomy, and accessible education for students with disabilities (ADHD, dyslexia, visual/hearing impairments).

Your outlines must be:
- Grounded strictly in the source material (no invented topics)
- Sequenced for learning transfer (concrete before abstract, simple before complex)
- Scoped so each section can be taught in 15–30 minutes
- Written with measurable Bloom's-level verbs in learning objectives (e.g., "identify", "explain", "apply", "analyze", "compare")
${studentProfile ? buildStudentContextInstructions(studentProfile) : ""}
Respond with ONLY valid JSON. No markdown fences, no preamble, no trailing text.`;

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Design a course outline from the following extracted source material.

${combinedContext}

Think step by step before producing JSON:

Step 1 — List every major topic covered across all parts of the source material.
Step 2 — Group related topics and identify the logical teaching sequence (foundational concepts first, applications later, synthesis last).
Step 3 — Scope each group into a section (not too broad — one main idea per section; not too narrow — don't split trivially related points).
Step 4 — For each section, write a learning objective using a measurable Bloom's verb. Bad: "Understand photosynthesis." Good: "Explain how chlorophyll absorbs light to drive the Calvin cycle."
Step 5 — List 3–5 specific key points per section drawn directly from the source material.

Then output this JSON (5–8 sections, no more, no fewer):
{
  "title": "Specific, descriptive title reflecting the actual subject matter",
  "description": "2–3 sentences: what the student will learn, why it matters, and what prior knowledge is assumed",
  "sections": [
    {
      "title": "Concise section title (max 8 words)",
      "learningObjective": "By the end of this section, students will be able to [measurable Bloom's verb] [specific outcome from source material]",
      "keyPoints": ["specific claim or fact from source", "specific claim or fact", "specific claim or fact"],
      "relevantContent": "Which part(s) of the source material this section draws from"
    }
  ]
}

Before finalizing, verify:
✓ Every section maps to actual content in the source material
✓ Learning objectives use measurable verbs, not "understand" or "know"
✓ Sections flow from foundational to advanced
✓ No major topic from the source is omitted`,
          },
        ],
      },
    ],
    config: { systemInstruction: systemPrompt },
  });

  return parseAIJson<CourseOutline>(response.text!);
}

// --- Pass 2b: Generate a single section with source context ---

function sectionWordRange(length: "short" | "medium" | "long"): string {
  if (length === "short") return "300–500";
  if (length === "long") return "900–1300";
  return "500–900";
}

async function generateSectionWithContext(
  courseTitle: string,
  section: SectionOutline,
  allSummaries: string[],
  studentProfile?: StudentProfileInput,
): Promise<SectionContent> {
  const sourceContext = allSummaries.join("\n\n---\n\n");

  const systemPrompt = `You are a senior educational content writer who specializes in accessible learning materials for students with diverse needs (ADHD, dyslexia, hearing/visual impairments, learning disabilities).

Your writing principles:
- Every claim must be grounded in the source material — no hallucinated facts
- Define technical terms immediately on first use, in plain language
- Use the "explain → example → apply" pattern for every concept: introduce it, show a concrete example, then show how it applies in the real world
- Short paragraphs (3 sentences max) — long paragraphs are a barrier for students with ADHD and dyslexia
- Active voice, present tense, second-person ("you") where natural
- Bold key terms on first use; use ## subheadings to chunk content visually
- Numbered lists for sequences or steps; bullet lists for non-ordered sets
- For mathematical expressions, use LaTeX notation: $inline$ for inline math, $$block$$ for display equations — only when the subject genuinely requires it (math, physics, chemistry, etc.)
${studentProfile ? buildStudentContextInstructions(studentProfile) : ""}
Respond with ONLY valid JSON. No markdown fences, no preamble, no trailing text.`;

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Write the full content for the section below. Stay strictly within the source material — do not invent examples or facts not present in it.

COURSE: ${courseTitle}
SECTION: ${section.title}
LEARNING OBJECTIVE: ${section.learningObjective}
KEY POINTS TO COVER: ${section.keyPoints.join(" | ")}
SOURCE MATERIAL FOCUS: ${section.relevantContent ?? "entire source"}

SOURCE MATERIAL:
${sourceContext}

Think step by step before writing:

Step 1 — Identify which parts of the source material directly support this section's learning objective and key points.
Step 2 — Plan the section structure: opening hook → key point 1 (explain → example → apply) → key point 2 → … → closing synthesis.
Step 3 — Write the full body using the planned structure. Every technical term gets bolded and immediately defined. Every abstract concept gets a concrete example from the source. Every subsection gets a ## heading.
Step 4 — Write a 3–4 sentence summary that a student could use as a quick reference, capturing the essential takeaway of each key point.
Step 5 — Extract all technical terms introduced in the body and write plain-language definitions (no jargon in the definition).

Output this JSON (body must be ${sectionWordRange("medium")} words of markdown):
{
  "title": "Exact section title",
  "body": "Full markdown content — ## subheadings, **bold key terms**, bullet/numbered lists, ${sectionWordRange("medium")} words",
  "summary": "3–4 sentences capturing the essential takeaway of each key point, suitable as a quick reference card",
  "keyTerms": [
    {
      "term": "term as it appears bolded in body",
      "definition": "plain-language definition, no technical jargon, 1–2 sentences max"
    }
  ]
}

Before finalizing, verify:
✓ Every key point listed above appears in the body
✓ All bolded terms appear in keyTerms
✓ No facts or examples were invented — all are traceable to source material
✓ Body is between ${sectionWordRange("medium")} words`,
          },
        ],
      },
    ],
    config: { systemInstruction: systemPrompt },
  });

  return parseAIJson<SectionContent>(response.text!);
}

// --- Public API ---

export async function generateCourse(
  input: CourseInput,
): Promise<{ outline: CourseOutline; sections: SectionContent[] }> {
  const fileSummaries: string[] = [];

  // Hierarchical path: per-file chunk summarization (parallel across files)
  if (input.filePdfs?.length) {
    console.log(
      `[course-generator] Processing ${input.filePdfs.length} files in parallel`,
    );
    const perFileResults = await Promise.all(
      input.filePdfs.map(async (chunks, fileIdx) => {
        const chunkSummaries = await withConcurrency(
          chunks.map((chunk) => () => summarizeChunk(chunk)),
          5,
        );
        return summarizeFile(fileIdx, input.filePdfs!.length, chunkSummaries);
      }),
    );
    fileSummaries.push(...perFileResults);
  }

  // Legacy flat-chunk path (single file, backwards compat)
  if (input.chunks?.length) {
    console.log(
      `[course-generator] Processing ${input.chunks.length} chunks (legacy path)`,
    );
    const chunkSummaries = await withConcurrency(
      input.chunks.map((chunk) => () => summarizeChunk(chunk)),
      5,
    );
    fileSummaries.push(await summarizeFile(0, 1, chunkSummaries));
  }

  // Topic text / DOCX text
  if (input.text?.trim()) {
    fileSummaries.push(input.text);
  }

  const outline = await generateOutlineFromSummaries(fileSummaries, input.studentProfile);

  // Generate all sections in parallel (max 5 concurrent)
  const sections = await withConcurrency(
    outline.sections.map(
      (section) => () =>
        generateSectionWithContext(outline.title, section, fileSummaries, input.studentProfile),
    ),
    5,
  );

  return { outline, sections };
}
