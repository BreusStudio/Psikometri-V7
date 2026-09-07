import { GoogleGenAI } from "@google/genai";
import { getServerConfig } from "../serverConfig";

let aiInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

export function getGeminiClient(): GoogleGenAI {
  const config = getServerConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure it in the Credentials settings tab.");
  }
  
  if (!aiInstance || currentApiKey !== apiKey) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    currentApiKey = apiKey;
  }
  
  return aiInstance;
}
