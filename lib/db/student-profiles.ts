import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type StudentProfile = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
  outputModes: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function docToProfile(
  id: string,
  data: FirebaseFirestore.DocumentData,
): StudentProfile {
  return {
    id,
    userId: data.userId,
    name: data.name,
    description: data.description ?? null,
    disabilities: data.disabilities ?? [],
    preferences: data.preferences ?? [],
    accessibilityNeeds: data.accessibilityNeeds ?? {
      fontSize: "medium",
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
    },
    outputModes: data.outputModes ?? [],
    isDefault: data.isDefault ?? false,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export async function getStudentProfile(
  profileId: string,
): Promise<StudentProfile | null> {
  const doc = await db.collection("studentProfiles").doc(profileId).get();
  if (!doc.exists) return null;
  return docToProfile(doc.id, doc.data()!);
}

export async function getStudentProfileByIdAndUser(
  profileId: string,
  userId: string,
): Promise<StudentProfile | null> {
  const doc = await db.collection("studentProfiles").doc(profileId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.userId !== userId) return null;
  return docToProfile(doc.id, data);
}

export async function getStudentProfiles(userId: string): Promise<StudentProfile[]> {
  const snap = await db
    .collection("studentProfiles")
    .where("userId", "==", userId)
    .orderBy("isDefault", "desc")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => docToProfile(d.id, d.data()));
}

export async function createStudentProfile(
  userId: string,
  data: {
    name: string;
    description?: string | null;
    disabilities: string[];
    preferences: string[];
    accessibilityNeeds: {
      fontSize: string;
      highContrast: boolean;
      reducedMotion: boolean;
      screenReaderOptimized: boolean;
    };
    outputModes: string[];
    isDefault: boolean;
  },
): Promise<StudentProfile> {
  if (data.isDefault) {
    // Unset all existing defaults for this user
    const snap = await db
      .collection("studentProfiles")
      .where("userId", "==", userId)
      .where("isDefault", "==", true)
      .get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
      await batch.commit();
    }
  }

  const docRef = await db.collection("studentProfiles").add({
    userId,
    name: data.name,
    description: data.description ?? null,
    disabilities: data.disabilities,
    preferences: data.preferences,
    accessibilityNeeds: data.accessibilityNeeds,
    outputModes: data.outputModes,
    isDefault: data.isDefault,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const doc = await docRef.get();
  return docToProfile(docRef.id, doc.data()!);
}

export async function updateStudentProfile(
  profileId: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string | null;
    disabilities: string[];
    preferences: string[];
    accessibilityNeeds: {
      fontSize: string;
      highContrast: boolean;
      reducedMotion: boolean;
      screenReaderOptimized: boolean;
    };
    outputModes: string[];
    isDefault: boolean;
  }>,
): Promise<StudentProfile | null> {
  const doc = await db.collection("studentProfiles").doc(profileId).get();
  if (!doc.exists || doc.data()!.userId !== userId) return null;

  if (data.isDefault) {
    const snap = await db
      .collection("studentProfiles")
      .where("userId", "==", userId)
      .where("isDefault", "==", true)
      .get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
      await batch.commit();
    }
  }

  await doc.ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  const updated = await doc.ref.get();
  return docToProfile(updated.id, updated.data()!);
}

export async function deleteStudentProfile(profileId: string): Promise<void> {
  await db.collection("studentProfiles").doc(profileId).delete();
}
