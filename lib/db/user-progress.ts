import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type UserProgress = {
  id: string;
  userId: string;
  courseId: string;
  contentId: string | null;
  completed: boolean;
  timeSpent: number;
  performanceData: string;
  createdAt: Date;
  updatedAt: Date;
};

function progressDocId(userId: string, contentId: string | null | undefined): string {
  return `${userId}_${contentId ?? "null"}`;
}

function docToProgress(
  id: string,
  courseId: string,
  data: FirebaseFirestore.DocumentData,
): UserProgress {
  return {
    id,
    userId: data.userId,
    courseId,
    contentId: data.contentId ?? null,
    completed: data.completed ?? false,
    timeSpent: data.timeSpent ?? 0,
    performanceData: data.performanceData ?? "{}",
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getProgressForCourse(
  userId: string,
  courseId: string,
): Promise<UserProgress[]> {
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("progress")
    .where("userId", "==", userId)
    .get();
  return snap.docs.map((d) => docToProgress(d.id, courseId, d.data()));
}

export async function upsertProgress(
  userId: string,
  courseId: string,
  contentId: string | null,
  data: {
    completed?: boolean;
    timeSpent?: number;
    performanceData?: string;
  },
): Promise<void> {
  const docId = progressDocId(userId, contentId);
  const docRef = db
    .collection("courses")
    .doc(courseId)
    .collection("progress")
    .doc(docId);

  const existing = await docRef.get();
  if (!existing.exists) {
    await docRef.set({
      userId,
      contentId: contentId ?? null,
      completed: data.completed ?? false,
      timeSpent: data.timeSpent ?? 0,
      performanceData: data.performanceData ?? "{}",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.timeSpent !== undefined) updateData.timeSpent = data.timeSpent;
    if (data.performanceData !== undefined) updateData.performanceData = data.performanceData;
    await docRef.update(updateData);
  }
}
