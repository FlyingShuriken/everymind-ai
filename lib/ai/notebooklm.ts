import { GoogleAuth } from "google-auth-library";
import { storagePut } from "@/lib/storage";
import { env } from "@/lib/env";

// Location-prefixed endpoint per the NotebookLM Enterprise API spec.
// GOOGLE_CLOUD_LOCATION should be "us", "eu", or "global" (default).
const loc = env.GOOGLE_CLOUD_LOCATION; // e.g. "us" or "global"
const proj = env.GOOGLE_CLOUD_PROJECT_NUMBER; // numeric project number required

const BASE = `https://${loc}-discoveryengine.googleapis.com/v1alpha/projects/${proj}/locations/${loc}`;
const UPLOAD_BASE = `https://${loc}-discoveryengine.googleapis.com/upload/v1alpha/projects/${proj}/locations/${loc}`;

async function getAccessToken(): Promise<string> {
  const credPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  const project = env.GOOGLE_CLOUD_PROJECT;

  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is required for NotebookLM Podcast API");
  }
  if (!proj) {
    throw new Error("GOOGLE_CLOUD_PROJECT_NUMBER is required for NotebookLM Podcast API");
  }
  if (!credPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is required for NotebookLM Podcast API");
  }

  const auth = new GoogleAuth({
    keyFile: credPath,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token as string;
}

export async function generatePodcast(
  courseTitle: string,
  allSectionText: string,
  courseId: string,
): Promise<string> {
  const token = await getAccessToken();

  // Step 1: Create notebook
  const createRes = await fetch(`${BASE}/notebooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: courseTitle }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`NotebookLM create notebook failed: ${err}`);
  }

  const notebook = (await createRes.json()) as { notebookId: string; name: string };
  const notebookId = notebook.notebookId;

  // Step 2: Upload the course text as a plain-text file source
  const textBytes = Buffer.from(allSectionText.slice(0, 500_000), "utf-8");
  const sourceRes = await fetch(
    `${UPLOAD_BASE}/notebooks/${notebookId}/sources:uploadFile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
        "X-Goog-Upload-Protocol": "raw",
        "X-Goog-Upload-File-Name": "course.txt",
      },
      body: textBytes,
    },
  );

  if (!sourceRes.ok) {
    const err = await sourceRes.text();
    throw new Error(`NotebookLM add source failed: ${err}`);
  }

  // Step 3: Request audio overview generation (empty body — API uses all sources with defaults)
  const audioRes = await fetch(`${BASE}/notebooks/${notebookId}/audioOverviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!audioRes.ok) {
    const err = await audioRes.text();
    throw new Error(`NotebookLM generate audio failed: ${err}`);
  }

  // Step 4: Poll audioOverviews/default until ready (up to 15 minutes)
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`${BASE}/notebooks/${notebookId}/audioOverviews/default`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pollRes.ok) {
      console.warn(`[notebooklm] Poll returned ${pollRes.status}: ${await pollRes.text()}`);
      continue;
    }

    const overview = (await pollRes.json()) as {
      audioOverview?: {
        status: string;
        audioOverviewId?: string;
      };
    };

    const status = overview.audioOverview?.status;
    console.log(`[notebooklm] Audio overview status: ${status}`, JSON.stringify(overview).slice(0, 300));

    if (status === "AUDIO_OVERVIEW_STATUS_FAILED") {
      throw new Error("NotebookLM audio overview generation failed");
    }

    if (status === "AUDIO_OVERVIEW_STATUS_READY") {
      // Step 5: Download the audio bytes
      const dlRes = await fetch(`${BASE}/notebooks/${notebookId}/audioOverviews/default`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "audio/mpeg",
        },
      });

      if (!dlRes.ok) {
        throw new Error(`NotebookLM audio download failed: ${await dlRes.text()}`);
      }

      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const stored = await storagePut(`podcast/${courseId}.mp3`, buffer, {
        contentType: "audio/mpeg",
      });
      return stored.url;
    }
  }

  throw new Error("NotebookLM podcast generation timed out after 15 minutes");
}
