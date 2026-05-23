import OpenAI from "openai";

const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

if (!apiKey) {
  throw new Error(
    "No OpenAI API key found. Set OPENAI_API_KEY or provision the OpenAI AI integration.",
  );
}

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
