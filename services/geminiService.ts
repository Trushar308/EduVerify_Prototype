
import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Using fallback for content generation.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const generateContentWithFallback = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        return `This is fallback content for the prompt: "${prompt}". The Gemini API is a powerful tool for generating human-like text. For instance, it can write essays, summarize articles, and even create code. Tools like GPT-3 have revolutionized natural language processing. This text is intentionally simple for demonstration.`;
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 1,
                topK: 1,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        return `Error generating content. Fallback: "${prompt}".`;
    }
};


export const generateDummySubmissionContent = async (assignmentTitle: string): Promise<string> => {
    const prompt = `Write a short, 200-word essay for a high school student on the topic: "${assignmentTitle}". Sound like a student who might have rushed it a bit.`;
    return generateContentWithFallback(prompt);
};

export const generateAIAssistedSubmissionContent = async (assignmentTitle: string): Promise<string> => {
    const prompt = `Write a comprehensive, 250-word essay for a university student on the topic: "${assignmentTitle}". Use sophisticated language and clear structure. Mention that this was written with assistance from a tool like Gemini or GPT to ensure accuracy and clarity.`;
    return generateContentWithFallback(prompt);
};
