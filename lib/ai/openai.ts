import OpenAI from "openai";
import { env } from "@/lib/env";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

if (env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

export const MODEL = env.AI_MODEL;
