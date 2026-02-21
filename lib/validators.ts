import { z } from "zod/v4";

export const roleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
});

export const needsSchema = z.object({
  disabilities: z.array(z.string()).min(1, "Select at least one option"),
});

export const preferencesSchema = z.object({
  preferences: z.array(z.string()).min(1, "Select at least one preference"),
});

export const accessibilitySchema = z.object({
  fontSize: z.enum(["default", "large", "x-large"]),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
  screenReaderOptimized: z.boolean(),
});

export const learningProfileSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
  disabilities: z.array(z.string()).min(1),
  preferences: z.array(z.string()).min(1),
  accessibilityNeeds: accessibilitySchema,
});

export type LearningProfileInput = z.infer<typeof learningProfileSchema>;

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  sourceType: z.enum(["upload", "topic"]),
  topic: z.string().max(2000).optional(),
  fileUrls: z.array(z.string().min(1)).optional(),
  studentProfileId: z.string().uuid().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const quizSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedIndex: z.number().int().min(0).max(3),
    }),
  ),
});

export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;
