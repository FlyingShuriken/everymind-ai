import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type CourseContent = {
  id: string;
  courseId: string;
  contentType: string;
  contentData: string;
  metadata: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

function docToContent(
  id: string,
  courseId: string,
  data: FirebaseFirestore.DocumentData,
): CourseContent {
  return {
    id,
    courseId,
    contentType: data.contentType,
    contentData: data.contentData ?? "{}",
    metadata: data.metadata ?? "{}",
    orderIndex: data.orderIndex ?? 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getCourseContents(courseId: string): Promise<CourseContent[]> {
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .orderBy("orderIndex", "asc")
    .get();
  return snap.docs.map((d) => docToContent(d.id, courseId, d.data()));
}

export async function getCourseContent(
  courseId: string,
  contentId: string,
): Promise<CourseContent | null> {
  const doc = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .doc(contentId)
    .get();
  if (!doc.exists) return null;
  return docToContent(doc.id, courseId, doc.data()!);
}

export async function getCourseContentByType(
  courseId: string,
  contentType: string,
): Promise<CourseContent | null> {
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .where("contentType", "==", contentType)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToContent(doc.id, courseId, doc.data());
}

export async function getCourseContentsByType(
  courseId: string,
  contentType: string,
): Promise<CourseContent[]> {
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .where("contentType", "==", contentType)
    .orderBy("orderIndex", "asc")
    .get();
  return snap.docs.map((d) => docToContent(d.id, courseId, d.data()));
}

export async function createCourseContent(
  courseId: string,
  data: {
    contentType: string;
    contentData: string;
    metadata?: string;
    orderIndex: number;
  },
): Promise<CourseContent> {
  const docRef = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .add({
      contentType: data.contentType,
      contentData: data.contentData,
      metadata: data.metadata ?? "{}",
      orderIndex: data.orderIndex,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  const doc = await docRef.get();
  return docToContent(docRef.id, courseId, doc.data()!);
}

export async function updateCourseContent(
  courseId: string,
  contentId: string,
  data: Partial<{ contentData: string; metadata: string; orderIndex: number }>,
): Promise<void> {
  await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .doc(contentId)
    .update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
}
