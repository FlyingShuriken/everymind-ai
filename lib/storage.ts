import { bucket } from "@/lib/firebase-admin";

interface PutResult {
  url: string;
}

export async function storagePut(
  pathname: string,
  data: File | Buffer,
  options: { contentType: string },
): Promise<PutResult> {
  const file = bucket.file(pathname);
  const buffer = data instanceof File ? Buffer.from(await data.arrayBuffer()) : data;
  await file.save(buffer, { metadata: { contentType: options.contentType }, resumable: false });
  await file.makePublic();
  return { url: file.publicUrl() };
}

export async function storageGet(url: string): Promise<Buffer> {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
