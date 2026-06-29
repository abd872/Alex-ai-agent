import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits to allow base64 images to be uploaded
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent startup crash if API key is not yet set
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in the Secrets panel in AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Helper to execute Gemini requests with automatic fallback models and retry logic.
// This prevents 503 "high demand" errors and transient 429 rate limits from breaking the application.
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction: string
) {
  // Use gemini-flash-latest and gemini-3.1-flash-lite first to bypass temporary high-demand 503 errors on gemini-3.5-flash
  const models = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generation using model "${model}" (attempt ${attempt}/3)...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
        console.log(`[Gemini API] Generation succeeded using model "${model}"`);
        return response;
      } catch (err: any) {
        lastError = err;
        // Use console.log instead of console.warn to avoid triggering strict warning/error filters on non-fatal retries
        console.log(`[Gemini API Info] Attempt ${attempt} with model "${model}" failed: ${err.message || err}`);
        if (attempt < 3) {
          // Exponential backoff: wait 1.5s, then 3s
          const backoffTime = attempt * 1500;
          console.log(`[Gemini API] Waiting ${backoffTime}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after trying multiple fallback models and retries.");
}

// REST API for Alex Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, systemInstruction, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    const ai = getGeminiClient();

    // Map history to the Gemini format
    // h can be e.g. { role: 'user' | 'model', text: '...' }
    const mappedHistory = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text || "" }],
    }));

    // Construct the parts for the current message
    const currentParts: any[] = [];
    if (message) {
      currentParts.push({ text: message });
    }

    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    // Append current turn
    mappedHistory.push({
      role: "user",
      parts: currentParts,
    });

    // Call the Gemini API with fallback and retries
    const sysInstruction = systemInstruction || "You are Alex, a helpful AI assistant.";
    const response = await generateContentWithRetryAndFallback(ai, mappedHistory, sysInstruction);

    const responseText = response.text || "I'm sorry, I couldn't generate a response.";
    
    // Check for search grounding or other metadata if present
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    res.json({
      text: responseText,
      groundingChunks: groundingChunks || null,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while communicating with Gemini.",
    });
  }
});

// Setup Vite or Static File Serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
