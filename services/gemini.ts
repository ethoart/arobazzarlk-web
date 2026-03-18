import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch {
  console.warn("Gemini API Key not set or invalid.");
}

export const generateProductDescription = async (name: string, category: string, features: string): Promise<string> => {
  if (!ai) return "A high-quality product. (Gemini API key missing)";
  try {
    const prompt = `Write a compelling, marketing-focused product description for an e-commerce store.
    Product Name: ${name}
    Category: ${category}
    Key Features: ${features}
    
    Keep it under 80 words. Make it sound premium and exciting.`;

    // Updated: Using gemini-3-flash-preview for Basic Text Tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description due to an error.";
  }
};

export const analyzeReviews = async (reviews: string[]): Promise<string> => {
    if (reviews.length === 0) return "No reviews to analyze.";
    if (!ai) return "Cannot analyze reviews. (Gemini API key missing)";

    try {
        const prompt = `Here are some customer reviews for a product:
        ${reviews.join('\n- ')}
        
        Summarize the general sentiment in one short paragraph. Highlight what users liked and disliked.`;

        // Updated: Using gemini-3-flash-preview for Basic Text Tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Analysis failed.";
    } catch {
        return "Error analyzing reviews.";
    }
};