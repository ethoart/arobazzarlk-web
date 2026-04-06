import { GoogleGenAI } from "@google/genai";

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: "Search the web for 'x402 payment layer coinbase linux foundation' or 'x402 protocol'. What is it? Is there an SDK for React/Node.js? Can it be integrated into a web app?",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
run();
