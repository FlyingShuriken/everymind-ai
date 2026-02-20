import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { storagePut } from "@/lib/storage";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and DOCX files are supported" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be under 25MB" },
      { status: 400 },
    );
  }

  const result = await storagePut(`${userId}/${file.name}`, file, {
    contentType: file.type,
  });

  return NextResponse.json({ url: result.url, filename: file.name });
}
