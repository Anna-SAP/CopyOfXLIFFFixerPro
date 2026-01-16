import { GoogleGenAI } from "@google/genai";
import { RepairResult } from "../types";
import { validateXML } from "./repairService";

export const repairWithGemini = async (brokenContent: string): Promise<RepairResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // We use a flash model for speed and cost-effectiveness on large text chunks
  const modelId = "gemini-2.5-flash"; 

  const systemInstruction = `You are an expert in XML and XLIFF localization file formats. 
  Your task is to repair a corrupted XLIFF file. 
  
  RULES:
  1. Return ONLY the valid, repaired XML content. Do not include markdown code blocks (e.g., \`\`\`xml).
  2. Fix encoding issues, unescaped entities (like &), and close any missing tags.
  3. Do not translate or change the translatable content text, only fix the structure.
  4. If the file is truncated, attempt to close the necessary tags to make it well-formed.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [{ text: `Here is the broken XLIFF content:\n\n${brokenContent}` }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Low temperature for deterministic structural fixes
      }
    });

    let fixedContent = response.text || "";
    
    // Clean up if the model adds markdown despite instructions
    fixedContent = fixedContent.replace(/^```xml\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    const validation = validateXML(fixedContent);

    return {
      fixedContent,
      isValid: validation.isValid,
      errors: validation.errors,
      wasModified: true // AI always generates "new" content
    };

  } catch (error: any) {
    console.error("Gemini Repair Error:", error);
    throw new Error(error.message || "Failed to repair with AI");
  }
};
