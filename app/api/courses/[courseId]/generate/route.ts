import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/db/users";
import { getCourse, updateCourse } from "@/lib/db/courses";
import { createCourseContent, updateCourseContent } from "@/lib/db/course-contents";
import { getStudentProfile } from "@/lib/db/student-profiles";
import { generateCourse, type CourseInput, withConcurrency } from "@/lib/ai/course-generator";
import { generateQuiz } from "@/lib/ai/quiz-generator";
import { generateSpeech } from "@/lib/ai/tts";
import { generateSectionImages } from "@/lib/ai/imagen";
import { generatePodcast } from "@/lib/ai/notebooklm";
import { generateSectionVideo } from "@/lib/ai/veo";
import { generateInteractiveExercises } from "@/lib/ai/interactive";
import { extractContent, extractPageChunks } from "@/lib/documents/extract";
import { storageGet } from "@/lib/storage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const course = await getCourse(courseId);

  if (!course || course.creatorId !== user.id) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (course.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Course already generated or in progress" },
      { status: 400 },
    );
  }

  const studentProfile = course.studentProfileId
    ? await getStudentProfile(course.studentProfileId)
    : null;

  await updateCourse(courseId, { status: "PROCESSING" });

  try {
    const sources = JSON.parse(
      course.sourceMaterials as string,
    ) as Array<{ type: string; url?: string; text?: string }>;

    const DOCX_MIME =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const PDF_MIME = "application/pdf";

    const fileSources = sources.filter((s) => s.type === "file" && s.url);
    const textSources = sources.filter((s) => s.type === "topic");

    // Extract all files in parallel
    const fileInputs = await Promise.all(
      fileSources.map(async (source) => {
        const buffer = await storageGet(source.url!);
        const mimeType = source.url!.endsWith(".docx") ? DOCX_MIME : PDF_MIME;
        if (mimeType === PDF_MIME) {
          return { type: "pdf" as const, chunks: await extractPageChunks(buffer) };
        } else {
          const extracted = await extractContent(buffer, mimeType);
          return { type: "text" as const, text: extracted.text ?? "" };
        }
      }),
    );

    const filePdfs = fileInputs
      .filter((f) => f.type === "pdf")
      .map((f) => f.chunks!);

    const textParts = [
      ...textSources.map((s) => s.text ?? ""),
      ...fileInputs.filter((f) => f.type === "text").map((f) => f.text!),
    ].filter(Boolean);

    const input: CourseInput = {
      filePdfs: filePdfs.length ? filePdfs : undefined,
      text: textParts.length ? textParts.join("\n\n") : undefined,
      studentProfile: studentProfile
        ? {
            disabilities: studentProfile.disabilities as string[],
            preferences: studentProfile.preferences as string[],
            accessibilityNeeds: studentProfile.accessibilityNeeds as {
              fontSize: string;
              highContrast: boolean;
              reducedMotion: boolean;
              screenReaderOptimized: boolean;
            },
          }
        : undefined,
    };

    if (!input.text?.trim() && !input.filePdfs?.length) {
      throw new Error("No content could be extracted from source materials");
    }

    const { outline, sections } = await generateCourse(input);

    await updateCourse(courseId, {
      title: outline.title,
      description: outline.description,
    });

    // Save text sections and collect their IDs
    const textContentIds: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const content = await createCourseContent(courseId, {
        contentType: "TEXT",
        contentData: JSON.stringify(sections[i]),
        metadata: JSON.stringify({
          outlineSection: outline.sections[i],
        }),
        orderIndex: i,
      });
      textContentIds.push(content.id);
    }

    // Generate quiz
    const quizTask = async () => {
      try {
        const quiz = await generateQuiz(
          outline.title,
          sections.map((s) => s.summary),
        );
        await createCourseContent(courseId, {
          contentType: "QUIZ",
          contentData: JSON.stringify(quiz),
          metadata: JSON.stringify({}),
          orderIndex: sections.length,
        });
      } catch (err) {
        console.error("[generate] Quiz generation failed:", err);
      }
    };

    // Generate per-section TTS narration
    const ttsTask = async () => {
      await withConcurrency(
        sections.map((section, i) => async () => {
          try {
            const audioUrl = await generateSpeech(
              `${section.title}. ${section.body}`,
              textContentIds[i],
            );
            await updateCourseContent(courseId, textContentIds[i], {
              metadata: JSON.stringify({
                outlineSection: outline.sections[i],
                audioUrl,
              }),
            });
          } catch (err) {
            console.error(`[generate] TTS failed for section ${i}:`, err);
          }
        }),
        3,
      );
    };

    const outputModes = ((studentProfile?.outputModes ?? []) as string[]);

    // Podcast generation (NotebookLM)
    const podcastTask = async () => {
      if (!outputModes.includes("audio")) return;
      try {
        const allText = sections
          .map((s, i) => `## ${outline.sections[i].title}\n\n${s.body}`)
          .join("\n\n---\n\n");
        const podcastUrl = await generatePodcast(outline.title, allText, courseId);
        await createCourseContent(courseId, {
          contentType: "PODCAST",
          contentData: JSON.stringify({ podcastUrl, courseTitle: outline.title }),
          metadata: JSON.stringify({}),
          orderIndex: 0,
        });
      } catch (err) {
        console.error("[generate] Podcast generation failed:", err);
      }
    };

    // Visual generation (Imagen 3)
    const visualTask = async () => {
      if (!outputModes.includes("visual")) return;
      await withConcurrency(
        sections.map((section, i) => async () => {
          try {
            const images = await generateSectionImages(
              section.title,
              section.body,
              outline.title,
              i,
            );
            if (images.length > 0) {
              await createCourseContent(courseId, {
                contentType: "VISUAL",
                contentData: JSON.stringify({ images, sectionTitle: section.title }),
                metadata: JSON.stringify({ sectionIndex: i }),
                orderIndex: i,
              });
            }
          } catch (err) {
            console.error(`[generate] Visual generation failed for section ${i}:`, err);
          }
        }),
        2,
      );
    };

    // Video generation (Veo 3.1 Fast)
    const videoTask = async () => {
      if (!outputModes.includes("video")) return;
      await withConcurrency(
        sections.map((section, i) => async () => {
          try {
            const videoUrl = await generateSectionVideo(
              section.title,
              section.summary,
              outline.title,
              i,
            );
            await createCourseContent(courseId, {
              contentType: "VIDEO",
              contentData: JSON.stringify({ videoUrl, sectionTitle: section.title }),
              metadata: JSON.stringify({ sectionIndex: i }),
              orderIndex: i,
            });
          } catch (err) {
            console.error(`[generate] Video generation failed for section ${i}:`, err);
          }
        }),
        1, // Videos are expensive — generate one at a time
      );
    };

    // Interactive exercises (Gemini)
    const interactiveTask = async () => {
      if (!outputModes.includes("interactive")) return;
      await withConcurrency(
        sections.map((section, i) => async () => {
          try {
            const exercises = await generateInteractiveExercises(
              section.title,
              section.body,
              section.summary,
            );
            await createCourseContent(courseId, {
              contentType: "INTERACTIVE",
              contentData: JSON.stringify(exercises),
              metadata: JSON.stringify({ sectionIndex: i }),
              orderIndex: i,
            });
          } catch (err) {
            console.error(`[generate] Interactive generation failed for section ${i}:`, err);
          }
        }),
        3,
      );
    };

    // Run all generation tasks (text is already saved; these run in parallel)
    await Promise.allSettled([
      quizTask(),
      ttsTask(),
      podcastTask(),
      visualTask(),
      videoTask(),
      interactiveTask(),
    ]);

    await updateCourse(courseId, { status: "READY" });

    return NextResponse.json({ status: "READY" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    await updateCourse(courseId, { status: "ERROR", generationError: message });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
