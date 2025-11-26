import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_TEXT_VISION = 'gemini-2.5-flash';

/**
 * Extracts text from a base64 image string.
 */
export const performOCR = async (base64Image: string): Promise<string> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Extract all text from this image exactly as it appears. Maintain the layout structure where possible. Return ONLY the raw extracted text. Do not wrap in markdown code blocks."
          }
        ]
      }
    });

    let text = response.text || "No text detected.";
    // Clean up if the model wrapped it in code blocks despite instructions
    text = text.replace(/^```(text)?\s*/i, '').replace(/\s*```$/, '');
    return text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text. Please try again.");
  }
};

/**
 * Translates text to the target language.
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_VISION,
      contents: `Translate the following text into ${targetLanguage}. Return ONLY the translated text, do not add any conversational filler or notes. Do not wrap in markdown code blocks.\n\nText:\n${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation Error:", error);
    throw new Error("Translation failed.");
  }
};

/**
 * Generates a smart title and tags for a document based on its text content.
 */
export const generateSmartDetails = async (text: string): Promise<{ title: string; tags: string[]; summary: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_VISION,
      contents: `Analyze the following text from a scanned document.
      1. Create a short, professional title (max 5 words).
      2. Extract 3 relevant categorical tags (e.g. Receipt, Work, Legal).
      3. Write a 1-sentence summary.
      
      Text: "${text.substring(0, 1500)}..."`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["title", "tags", "summary"]
        }
      }
    });

    // Robust parsing: strip markdown code blocks if present
    const rawText = response.text || '{}';
    const jsonString = rawText.replace(/```json|```/g, '').trim();
    const json = JSON.parse(jsonString);

    return {
      title: json.title || "Scanned Document",
      tags: json.tags || ["Scan"],
      summary: json.summary || "No summary available."
    };

  } catch (error) {
    console.warn("Smart details generation failed, using defaults.", error);
    return { title: "Scanned Document", tags: ["Scan"], summary: "" };
  }
};