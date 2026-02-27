import { GoogleAuth } from "google-auth-library";
import { storagePut } from "@/lib/storage";
import { env } from "@/lib/env";

const BASE = `https://discoveryengine.googleapis.com/v1/projects/${env.GOOGLE_CLOUD_PROJECT}/locations/${env.GOOGLE_CLOUD_LOCATION}`;

async function getAccessToken(): Promise<string> {
  if (!env.GOOGLE_CLOUD_PROJECT) {
    throw new Error("GOOGLE_CLOUD_PROJECT is required for podcast generation");
  }
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is required for podcast generation");
  }

  const auth = new GoogleAuth({
    keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to get Google auth token");
  return tokenResponse.token;
}

export async function generatePodcast(
  courseTitle: string,
  allSectionText: string,
  courseId: string,
): Promise<string> {
  const token = await getAccessToken();

  // Step 1: Submit podcast generation
  const generateRes = await fetch(`${BASE}/podcasts:generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: [{ textContent: allSectionText.slice(0, 500_000) }],
      focus: `Explain the key concepts of "${courseTitle}" in an engaging way.`,
      length: "SHORT",
      languageCode: "en-US",
      podcastTitle: courseTitle,
    }),
  });

  if (!generateRes.ok) {
    throw new Error(`Podcast generate failed: ${await generateRes.text()}`);
  }

  const operation = (await generateRes.json()) as { name: string };
  const operationName = operation.name;
  console.log(`[podcast] Operation started: ${operationName}`);

  // Step 2: Poll the LRO until done
  const pollUrl = `https://discoveryengine.googleapis.com/v1/${operationName}`;
  const deadline = Date.now() + 15 * 60 * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15_000));

    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pollRes.ok) {
      console.warn(`[podcast] Poll ${pollRes.status}: ${await pollRes.text()}`);
      continue;
    }

    const status = (await pollRes.json()) as { done?: boolean; error?: { message: string } };
    console.log(`[podcast] done=${status.done}`);

    if (status.error) {
      throw new Error(`Podcast generation failed: ${status.error.message}`);
    }

    if (status.done) {
      // Step 3: Download the MP3
      const downloadUrl = `https://discoveryengine.googleapis.com/v1/${operationName}:download?alt=media`;
      const dlRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!dlRes.ok) {
        throw new Error(`Podcast download failed: ${await dlRes.text()}`);
      }

      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const stored = await storagePut(`podcast/${courseId}.mp3`, buffer, {
        contentType: "audio/mpeg",
      });

      console.log(`[podcast] Saved to ${stored.url}`);
      return stored.url;
    }
  }

  throw new Error("Podcast generation timed out after 15 minutes");
}
