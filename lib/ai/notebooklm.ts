import { GoogleAuth } from "google-auth-library";
import { storagePut } from "@/lib/storage";
import { env } from "@/lib/env";

const DISCOVERY_ENGINE_BASE = "https://discoveryengine.googleapis.com/v1alpha";

async function getAccessToken(): Promise<string> {
  const credPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  const project = env.GOOGLE_CLOUD_PROJECT;

  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is required for NotebookLM Podcast API");
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
  const project = env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT required for podcast generation");
  }

  const token = await getAccessToken();

  // Create a notebook and generate audio overview
  const notebookPayload = {
    displayName: courseTitle,
    sources: [
      {
        inlineSource: {
          content: allSectionText.slice(0, 100000), // max 100K chars
          mimeType: "text/plain",
        },
      },
    ],
  };

  // Create notebook
  const createRes = await fetch(
    `${DISCOVERY_ENGINE_BASE}/projects/${project}/locations/global/collections/default_collection/dataStores/-/notebooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notebookPayload),
    },
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`NotebookLM create notebook failed: ${err}`);
  }

  const notebook = (await createRes.json()) as { name: string };
  const notebookName = notebook.name;

  // Generate audio overview
  const audioRes = await fetch(
    `${DISCOVERY_ENGINE_BASE}/${notebookName}:generateAudioOverview`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!audioRes.ok) {
    const err = await audioRes.text();
    throw new Error(`NotebookLM generate audio failed: ${err}`);
  }

  // Poll for operation completion
  const operation = (await audioRes.json()) as { name: string; done?: boolean; response?: { audioData?: string } };
  const operationName = operation.name;

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(
      `${DISCOVERY_ENGINE_BASE}/${operationName}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!pollRes.ok) continue;

    const op = (await pollRes.json()) as {
      done?: boolean;
      response?: { audioData?: string };
      error?: { message: string };
    };

    if (op.done) {
      if (op.error) throw new Error(`Podcast generation failed: ${op.error.message}`);
      if (!op.response?.audioData) throw new Error("No audio data in podcast response");

      const buffer = Buffer.from(op.response.audioData, "base64");
      const stored = await storagePut(`podcast/${courseId}.mp3`, buffer, {
        contentType: "audio/mpeg",
      });
      return stored.url;
    }
  }

  throw new Error("NotebookLM podcast generation timed out after 5 minutes");
}
