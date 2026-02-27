import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type User = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return {
    id,
    clerkId: data.clerkId,
    email: data.email,
    name: data.name ?? null,
    role: data.role ?? null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const snap = await db.collection("users").where("clerkId", "==", clerkId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function upsertUserByClerkId(
  clerkId: string,
  opts: {
    create: { email: string; name?: string | null; role?: string | null };
    update: { email?: string; name?: string | null; role?: string | null };
  },
): Promise<User> {
  const snap = await db.collection("users").where("clerkId", "==", clerkId).limit(1).get();

  if (snap.empty) {
    const id = crypto.randomUUID();
    const docRef = db.collection("users").doc(id);
    await docRef.set({
      clerkId,
      email: opts.create.email,
      name: opts.create.name ?? null,
      role: opts.create.role ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const newDoc = await docRef.get();
    return docToUser(id, newDoc.data()!);
  }

  const doc = snap.docs[0];
  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (opts.update.email !== undefined) updateData.email = opts.update.email;
  if (opts.update.name !== undefined) updateData.name = opts.update.name;
  if (opts.update.role !== undefined) updateData.role = opts.update.role;
  await doc.ref.update(updateData);
  const updated = await doc.ref.get();
  return docToUser(doc.id, updated.data()!);
}

export async function deleteUserCascade(userId: string): Promise<void> {
  // Delete learning profile
  await db.collection("learningProfiles").doc(userId).delete();

  // Delete student profiles
  const profilesSnap = await db
    .collection("studentProfiles")
    .where("userId", "==", userId)
    .get();
  const batch1 = db.batch();
  profilesSnap.docs.forEach((d) => batch1.delete(d.ref));
  if (!profilesSnap.empty) await batch1.commit();

  // Delete courses with subcollections
  const coursesSnap = await db
    .collection("courses")
    .where("creatorId", "==", userId)
    .get();
  for (const courseDoc of coursesSnap.docs) {
    await deleteCourseSubcollections(courseDoc.id);
    await courseDoc.ref.delete();
  }

  // Delete user doc
  await db.collection("users").doc(userId).delete();
}

async function deleteCourseSubcollections(courseId: string): Promise<void> {
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
  if (!contentsSnap.empty || !progressSnap.empty) await batch.commit();
}
