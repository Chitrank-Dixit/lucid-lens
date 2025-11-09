
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateDreamImage(dreamText: string): Promise<string> {
  const prompt = `Create a high-resolution, dream-like, surrealist digital painting based on the emotional themes of this dream: "${dreamText}". The style should be ethereal and evocative, blending elements in a non-literal way.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("Image generation returned no images.");
    }
  } catch (error) {
    console.error("Error generating dream image:", error);
    throw new Error("Failed to generate dream image.");
  }
}

export async function interpretDream(dreamText: string): Promise<string> {
  const systemInstruction = `You are a compassionate dream analyst specializing in Jungian psychology. Your task is to interpret the provided dream text. Structure your response in Markdown with the following sections:
### Core Emotional Theme
Briefly identify the central feeling or mood of the dream.
### Key Symbols & Archetypes
List the most significant symbols or figures from the dream and their potential archetypal meanings (e.g., The Shadow, Anima/Animus, The Wise Old Man).
### Potential Interpretation
Provide a thoughtful analysis of what the dream might signify for the dreamer's waking life, focusing on themes of personal growth, unresolved conflicts, or hidden potentials. Be gentle and use speculative language (e.g., 'could suggest,' 'might represent').`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: dreamText,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error interpreting dream:", error);
    throw new Error("Failed to interpret dream.");
  }
}
