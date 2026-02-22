import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/ai/quiz-generator";
import { quizSubmissionSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId },
  });

  if (!course || course.status !== "READY") {
    return NextResponse.json(
      { error: "Course not found or not ready" },
      { status: 404 },
    );
  }

  // Check for existing quiz
  const existingQuiz = await prisma.courseContent.findFirst({
    where: { courseId, contentType: "QUIZ" },
  });

  if (existingQuiz) {
    return NextResponse.json(JSON.parse(existingQuiz.contentData as string));
  }

  // Generate quiz from section summaries
  const sections = await prisma.courseContent.findMany({
    where: { courseId, contentType: "TEXT" },
    orderBy: { orderIndex: "asc" },
  });

  const summaries = sections.map((s) => {
    const data = JSON.parse(s.contentData as string);
    return data.summary as string;
  });

  const quiz = await generateQuiz(course.title, summaries);

  // Cache as CourseContent
  await prisma.courseContent.create({
    data: {
      courseId,
      contentType: "QUIZ",
      contentData: JSON.stringify(quiz),
      orderIndex: 999,
    },
  });

  return NextResponse.json(quiz);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = quizSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 },
    );
  }

  // Get quiz content
  const quizContent = await prisma.courseContent.findFirst({
    where: { courseId, contentType: "QUIZ" },
  });

  if (!quizContent) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const quiz = JSON.parse(quizContent.contentData as string);
  const { answers } = parsed.data;

  let correct = 0;
  const results = answers.map((a) => {
    const question = quiz.questions[a.questionIndex];
    const isCorrect = question?.correctIndex === a.selectedIndex;
    if (isCorrect) correct++;
    return {
      questionIndex: a.questionIndex,
      correct: isCorrect,
      correctIndex: question?.correctIndex,
      explanation: question?.explanation,
    };
  });

  const score = quiz.questions.length > 0 ? correct / quiz.questions.length : 0;

  // Save progress
  await prisma.userProgress.upsert({
    where: {
      userId_courseId_contentId: {
        userId: user.id,
        courseId,
        contentId: quizContent.id,
      },
    },
    update: {
      completed: true,
      performanceData: JSON.stringify({ score, correct, total: quiz.questions.length, results }),
    },
    create: {
      userId: user.id,
      courseId,
      contentId: quizContent.id,
      completed: true,
      performanceData: JSON.stringify({ score, correct, total: quiz.questions.length, results }),
    },
  });

  return NextResponse.json({ score, correct, total: quiz.questions.length, results });
}
