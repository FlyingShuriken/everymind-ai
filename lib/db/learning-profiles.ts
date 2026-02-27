import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type LearningProfile = {
  id: string;
  userId: string;
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: Record<string, unknown>;
  assessmentResults: Record<string, unknown>;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function docToProfile(
  id: string,
  data: FirebaseFirestore.DocumentData,
): LearningProfile {
  return {
    id,
    userId: id,
    disabilities: data.disabilities ?? [],
    preferences: data.preferences ?? [],
    accessibilityNeeds: data.accessibilityNeeds ?? {},
    assessmentResults: data.assessmentResults ?? {},
    completedAt: data.completedAt
      ? (data.completedAt as Timestamp).toDate()
      : null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getLearningProfile(
  userId: string,
): Promise<LearningProfile | null> {
  const doc = await db.collection("learningProfiles").doc(userId).get();
  if (!doc.exists) return null;
  return docToProfile(doc.id, doc.data()!);
}

export async function upsertLearningProfile(
  userId: string,
  data: {
    disabilities?: string[];
    preferences?: string[];
    accessibilityNeeds?: Record<string, unknown>;
    completedAt?: Date | null;
  },
): Promise<LearningProfile> {
  const docRef = db.collection("learningProfiles").doc(userId);
  const existing = await docRef.get();

  if (!existing.exists) {
    await docRef.set({
      disabilities: data.disabilities ?? [],
      preferences: data.preferences ?? [],
      accessibilityNeeds: data.accessibilityNeeds ?? {},
      assessmentResults: {},
      completedAt: data.completedAt ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (data.disabilities !== undefined) updateData.disabilities = data.disabilities;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;
    if (data.accessibilityNeeds !== undefined) updateData.accessibilityNeeds = data.accessibilityNeeds;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    await docRef.update(updateData);
  }

  const updated = await docRef.get();
  return docToProfile(updated.id, updated.data()!);
}
