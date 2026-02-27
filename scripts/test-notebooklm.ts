/**
 * Standalone NotebookLM integration test script.
 *
 * Run with:
 *   node --env-file=.env --experimental-strip-types scripts/test-notebooklm.ts
 *
 * Or if you have tsx installed:
 *   npx tsx --env-file=.env scripts/test-notebooklm.ts
 *
 * Or via dotenv:
 *   node -e "require('dotenv').config()" && npx tsx scripts/test-notebooklm.ts
 *   (or just set env vars manually before running)
 *
 * Steps that run:
 *   1. Verify env vars + auth token
 *   2. Create a test notebook
 *   3. Upload a short text source
 *   4. Create audio overview
 *   5. Poll until ready (or timeout)
 *   6. Attempt to download / inspect the ready response
 */

// import { config } from "dotenv";
// import { resolve } from "path";
import { GoogleAuth } from "google-auth-library";

// Load .env from project root
// config({ path: resolve(process.cwd(), ".env") });

// ── Config from env ────────────────────────────────────────────────────────────

const loc = process.env.GOOGLE_CLOUD_LOCATION ?? "global";
const proj = process.env.GOOGLE_CLOUD_PROJECT_NUMBER;
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;

const BASE = `https://${loc}-discoveryengine.googleapis.com/v1alpha/projects/${proj}/locations/${loc}`;
const UPLOAD_BASE = `https://${loc}-discoveryengine.googleapis.com/upload/v1alpha/projects/${proj}/locations/${loc}`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
}
function step(n: number, msg: string) {
  console.log(`\nStep ${n}: ${msg}`);
  console.log("─".repeat(50));
}

async function getToken(): Promise<string> {
  const auth = new GoogleAuth({
    keyFile: credPath,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  if (!res.token) throw new Error("getAccessToken returned null token");
  return res.token;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== NotebookLM Integration Test ===\n");

  // ── Step 1: Env + Auth ──────────────────────────────────────────────────────
  step(1, "Verify env vars and auth token");

  console.log(`  GOOGLE_CLOUD_LOCATION    = ${loc}`);
  console.log(`  GOOGLE_CLOUD_PROJECT     = ${gcpProject ?? "(not set)"}`);
  console.log(`  GOOGLE_CLOUD_PROJECT_NUMBER = ${proj ?? "(not set)"}`);
  console.log(`  GOOGLE_APPLICATION_CREDENTIALS = ${credPath ?? "(not set)"}`);
  console.log(`  BASE URL = ${BASE}`);

  if (!proj)
    fail(
      "GOOGLE_CLOUD_PROJECT_NUMBER is not set — URL will contain 'undefined'",
    );
  if (!credPath) fail("GOOGLE_APPLICATION_CREDENTIALS is not set");
  if (!gcpProject) fail("GOOGLE_CLOUD_PROJECT is not set");

  let token: string;
  try {
    token = await getToken();
    ok(`Got access token (${token.slice(0, 20)}...)`);
  } catch (e) {
    fail(`Auth failed: ${e}`);
    process.exit(1);
  }

  // ── Step 2: Create notebook ─────────────────────────────────────────────────
  step(2, "Create notebook");

  const createRes = await fetch(`${BASE}/notebooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: "Test Notebook - NotebookLM Debug" }),
  });

  const createBody = await createRes.text();
  console.log(`  Status: ${createRes.status}`);
  console.log(`  Response: ${createBody.slice(0, 500)}`);

  if (!createRes.ok) {
    fail("Create notebook failed — stopping.");
    process.exit(1);
  }

  const notebook = JSON.parse(createBody) as {
    notebookId: string;
    name: string;
  };
  const notebookId = notebook.notebookId;

  if (!notebookId) {
    fail(`notebookId is missing from response. Full response: ${createBody}`);
    process.exit(1);
  }
  ok(`notebookId = ${notebookId}`);

  // ── Step 3: Upload text source ──────────────────────────────────────────────
  step(3, "Upload text source");

  const sampleText =
    "Gradient descent is an iterative optimization algorithm used in machine learning. " +
    "It works by computing the gradient of the loss function with respect to model parameters " +
    "and updating parameters in the direction that reduces the loss. " +
    "The learning rate controls the step size at each iteration.";

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
      body: Buffer.from(sampleText, "utf-8"),
    },
  );

  const sourceBody = await sourceRes.text();
  console.log(`  Status: ${sourceRes.status}`);
  console.log(`  Response: ${sourceBody.slice(0, 500)}`);

  if (!sourceRes.ok) {
    fail("Upload source failed — stopping.");
    process.exit(1);
  }
  ok("Source uploaded");

  // ── Step 4: Create audio overview ───────────────────────────────────────────
  step(4, "Create audio overview (POST)");

  const audioRes = await fetch(
    `${BASE}/notebooks/${notebookId}/audioOverviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const audioBody = await audioRes.text();
  console.log(`  Status: ${audioRes.status}`);
  console.log(`  Response: ${audioBody.slice(0, 500)}`);

  if (!audioRes.ok) {
    fail("Create audio overview failed — stopping.");
    process.exit(1);
  }
  const audioParsed = JSON.parse(audioBody) as {
    audioOverview?: { audioOverviewId?: string; status?: string };
  };
  const audioOverviewId = audioParsed.audioOverview?.audioOverviewId;
  if (!audioOverviewId) {
    fail(`audioOverviewId missing from creation response: ${audioBody}`);
    process.exit(1);
  }
  ok(`audioOverviewId = ${audioOverviewId}`);

  // ── Step 5: Probe available GET endpoints ────────────────────────────────────
  step(5, "Probe GET endpoints to find what works");

  await new Promise((r) => setTimeout(r, 3000)); // brief wait for API consistency

  const probeUrls = [
    { label: "GET notebook", url: `${BASE}/notebooks/${notebookId}` },
    {
      label: "GET audioOverviews (list)",
      url: `${BASE}/notebooks/${notebookId}/audioOverviews`,
    },
    {
      label: "GET audioOverviews/{id}",
      url: `${BASE}/notebooks/${notebookId}/audioOverviews/${audioOverviewId}`,
    },
    {
      label: "GET audioOverviews/default",
      url: `${BASE}/notebooks/${notebookId}/audioOverviews/default`,
    },
    {
      label: "GET via full resource name",
      url: `https://global-discoveryengine.googleapis.com/v1alpha/projects/25271441384/locations/global/notebooks/${notebookId}/audioOverviews/${audioOverviewId}`,
    },
  ];

  for (const { label, url } of probeUrls) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.text();
    console.log(`\n  [${res.status}] ${label}`);
    console.log(`  URL: ${url}`);
    console.log(`  Body: ${body.slice(0, 400)}`);
  }

  // ── Step 6: Poll GET notebook for 10 minutes (full response, no truncation) ──
  step(6, "Poll GET notebook for 10 minutes (full response)");

  const notebookUrl = `${BASE}/notebooks/${notebookId}`;
  const deadline = Date.now() + 10 * 60 * 1000;
  let prevBody = "";

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10000));
    const res = await fetch(notebookUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.text();

    // Only print when something changes
    if (body !== prevBody) {
      console.log(`\n  [${res.status}] CHANGED at ${new Date().toISOString()}`);
      console.log(body); // full response, no truncation
      prevBody = body;
    } else {
      process.stdout.write(".");
    }

    if (body.toLowerCase().includes("audio")) {
      ok("\nFound audio-related field in notebook response!");
      break;
    }
  }
  console.log();

  console.log("\n=== Test complete ===");
}

main().catch((e) => {
  console.error("\nFatal error:", e);
  process.exit(1);
});
