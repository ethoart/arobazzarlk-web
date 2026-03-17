import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, category: string, features: string): Promise<string> => {
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
    } catch (error) {
        return "Error analyzing reviews.";
    }
};