import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

export const MODEL = process.env.AI_MODEL ?? "openai/gpt-4o";
