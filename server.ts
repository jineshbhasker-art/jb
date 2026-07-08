import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent for AI Studio Build telemetry
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai });
});

// AI Scent Matchmaker endpoint
app.post("/api/scent-matchmaker", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API is not configured on the server. Please verify your GEMINI_API_KEY in the Secrets settings.",
      });
    }

    const { preferences, products } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: "Preferences are required." });
    }

    // Prepare catalog data for Gemini context (minimizing payload tokens)
    const catalogContext = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      scentFamily: p.scentFamily || "Bespoke Blend",
      topNotes: p.topNotes || "",
      middleNotes: p.middleNotes || "",
      baseNotes: p.baseNotes || "",
      concentration: p.concentration || "",
      description: p.description || ""
    }));

    const prompt = `You are the master perfume nose and luxury matchmaker at Scents & Souls Perfume LAB, Dubai.
A client is looking for a personalized fragrance recommendation based on their profiling and preferences:

CLIENT PREFERENCES:
- Scent Families: ${Array.isArray(preferences.scentFamilies) ? preferences.scentFamilies.join(", ") : preferences.scentFamilies || "Any"}
- Occasion/Mood: ${preferences.occasion || "Any"}
- Favorite Notes/Ingredients: ${Array.isArray(preferences.favoriteNotes) ? preferences.favoriteNotes.join(", ") : preferences.favoriteNotes || "Any"}
- Desired Concentration/Intensity: ${preferences.concentration || "Any"}
- Custom Description/Request: "${preferences.customPrompt || "No custom description provided."}"

AVAILABLE PRODUCT CATALOG:
${JSON.stringify(catalogContext, null, 2)}

TASK:
1. Analyze the client's preferences, occasion, and custom requests.
2. Select up to 3 best matching products from the AVAILABLE PRODUCT CATALOG. Recommend products that actually exist in the catalog.
3. For each recommended product, calculate a match percentage (50-100%) and write a highly artistic, evocative luxury explanation of why it fits their profile, notes, and occasion. Suggest layering combinations.
4. Synthesize a "Bespoke Laboratory Formula" recipe representing a custom fragrance oil blend tailored precisely to their dream profile, specifying ingredients with percentages summing up to exactly 100%, their roles (Top, Middle, Base), and a luxury care ritual.

Be creative, evocative, and maintain a highly polished, high-end perfume boutique persona.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, world-class artisanal perfume nose and bespoke fragrance curator. Your communication is sophisticated, luxury-focused, and highly precise regarding scent layering and oil ratios.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              description: "List of recommended products from the provided catalog matching the user's requirements.",
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: "The ID of the recommended product from the catalog." },
                  matchPercentage: { type: Type.INTEGER, description: "Match percentage between 50 and 100." },
                  whyItMatches: { type: Type.STRING, description: "Sophisticated, evocative description of why this product fits, highlighting specific notes." },
                  layeringAdvice: { type: Type.STRING, description: "Expert advice on how to layer this perfume with other elements in the boutique." }
                },
                required: ["productId", "matchPercentage", "whyItMatches", "layeringAdvice"]
              }
            },
            bespokeFormula: {
              type: Type.OBJECT,
              description: "A customized luxury formulation representing a 100% concentrated bespoke oil blend.",
              properties: {
                name: { type: Type.STRING, description: "An evocative, luxury, poetic name for the custom blend." },
                description: { type: Type.STRING, description: "A rich narrative describing the fragrance journey and olfactory profile." },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      noteName: { type: Type.STRING, description: "The specific raw note ingredient name (e.g., Cambodian Oud, Florentine Iris)." },
                      percentage: { type: Type.INTEGER, description: "The formulation percentage (must sum to 100 with others)." },
                      role: { type: Type.STRING, description: "Either 'Top Note', 'Middle Note', or 'Base Note'." }
                    },
                    required: ["noteName", "percentage", "role"]
                  }
                },
                careRitual: { type: Type.STRING, description: "A bespoke ritual on application, storage, or maturation for the custom scent." }
              },
              required: ["name", "description", "ingredients", "careRitual"]
            }
          },
          required: ["recommendations", "bespokeFormula"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini API");
    }

    const resultJson = JSON.parse(resultText.trim());
    res.json(resultJson);
  } catch (error: any) {
    console.error("Scent Matchmaker Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during matching." });
  }
});

// Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
