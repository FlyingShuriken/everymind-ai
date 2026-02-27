import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type Course = {
  id: string;
  title: string;
  description: string | null;
  sourceMaterials: string;
  creatorId: string;
  studentProfileId: string | null;
  status: string;
  generationError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function docToCourse(id: string, data: FirebaseFirestore.DocumentData): Course {
  return {
    id,
    title: data.title,
    description: data.description ?? null,
    sourceMaterials: data.sourceMaterials ?? "[]",
    creatorId: data.creatorId,
    studentProfileId: data.studentProfileId ?? null,
    status: data.status ?? "DRAFT",
    generationError: data.generationError ?? null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const doc = await db.collection("courses").doc(courseId).get();
  if (!doc.exists) return null;
  return docToCourse(doc.id, doc.data()!);
}

export async function getCoursesByCreator(userId: string): Promise<Course[]> {
  const snap = await db
    .collection("courses")
    .where("creatorId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => docToCourse(d.id, d.data()));
}

export async function createCourse(data: {
  title: string;
  creatorId: string;
  studentProfileId?: string | null;
  sourceMaterials: string;
}): Promise<Course> {
  const docRef = await db.collection("courses").add({
    title: data.title,
    description: null,
    sourceMaterials: data.sourceMaterials,
    creatorId: data.creatorId,
    studentProfileId: data.studentProfileId ?? null,
    status: "DRAFT",
    generationError: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const doc = await docRef.get();
  return docToCourse(docRef.id, doc.data()!);
}

export async function updateCourse(
  courseId: string,
  data: Partial<{
    title: string;
    description: string | null;
    status: string;
    generationError: string | null;
  }>,
): Promise<void> {
  await db.collection("courses").doc(courseId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteCourse(courseId: string): Promise<void> {
  // Delete subcollections first
  const contentsSnap = await db
    .collection("courses")
    .doc(courseId)
    .collection("contents")
    .get();
  const progressSnap = await db
    .collection("courses")
    .doc(courseId)
    .collection("progress")
    .get();

  const batch = db.batch();
  contentsSnap.docs.forEach((d) => batch.delete(d.ref));
  progressSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("courses").doc(courseId));
  await batch.commit();
}
