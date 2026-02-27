import { z } from "zod/v4";

const envSchema = z.object({
  GOOGLE_API_KEY: z.string().min(1),
  GOOGLE_GENAI_USE_VERTEXAI: z.string().optional().default("true"),
  GOOGLE_CLOUD_LOCATION: z.string().optional().default("global"),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_NUMBER: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().min(1),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("production"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export const env = getEnv();
