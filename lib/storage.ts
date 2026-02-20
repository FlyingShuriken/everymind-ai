import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { env } from "@/lib/env";

const isDev = env.NEXT_PUBLIC_NODE_ENV === "development";

interface PutResult {
  url: string;
}

export async function storagePut(
  pathname: string,
  data: File | Buffer,
  options: { contentType: string },
): Promise<PutResult> {
  if (isDev) {
    return localPut(pathname, data, options);
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(pathname, data, {
    access: "public",
    contentType: options.contentType,
  });
  return { url: blob.url };
}

export async function storageGet(url: string): Promise<Buffer> {
  if (isDev && url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    return readFile(filePath);
  }

  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}

async function localPut(
  pathname: string,
  data: File | Buffer,
  _options: { contentType: string },
): Promise<PutResult> {
  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(pathname));
  await mkdir(dir, { recursive: true });

  const filePath = path.join(process.cwd(), "public", "uploads", pathname);
  const buffer = data instanceof File ? Buffer.from(await data.arrayBuffer()) : data;
  await writeFile(filePath, buffer);

  return { url: `/uploads/${pathname}` };
}
