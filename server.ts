import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to lazy initialize Gemini SDK with User-Agent for AI Studio Build telemetry
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Algorithmic rule-based fallback when GEMINI_API_KEY is not configured
function generateRuleBasedScentMatch(preferences: any, products: any[]) {
  const scentFamilies: string[] = Array.isArray(preferences.scentFamilies)
    ? preferences.scentFamilies
    : preferences.scentFamilies ? [preferences.scentFamilies] : [];
  const favoriteNotes: string[] = Array.isArray(preferences.favoriteNotes)
    ? preferences.favoriteNotes
    : (preferences.favoriteNotes || "").split(",").map((n: string) => n.trim()).filter(Boolean);
  const targetOccasion = preferences.occasion || "Daily Signature";
  const customPrompt = (preferences.customPrompt || "").toLowerCase();

  const scoredProducts = (products || []).map((p: any) => {
    let score = 55;
    // Scent family match
    if (scentFamilies.length > 0 && scentFamilies.some(sf => 
      (p.scentFamily || "").toLowerCase().includes(sf.toLowerCase()) || 
      (p.category || "").toLowerCase().includes(sf.toLowerCase())
    )) {
      score += 25;
    }
    // Favorite notes match
    const productNotes = `${p.topNotes || ''} ${p.middleNotes || ''} ${p.baseNotes || ''} ${p.description || ''}`.toLowerCase();
    favoriteNotes.forEach((note: string) => {
      if (note && productNotes.includes(note.toLowerCase())) {
        score += 15;
      }
    });
    // Custom prompt matching
    if (customPrompt && productNotes.split(' ').some((word: string) => word.length > 3 && customPrompt.includes(word))) {
      score += 10;
    }

    const matchPercentage = Math.min(98, Math.max(68, score));
    return {
      product: p,
      matchPercentage,
      score
    };
  });

  scoredProducts.sort((a, b) => b.score - a.score);
  const topMatches = scoredProducts.slice(0, 3);

  const recommendations = topMatches.map(({ product, matchPercentage }) => ({
    productId: product.id,
    matchPercentage,
    whyItMatches: `Harmonizes gracefully with your preference for ${scentFamilies.join(', ') || 'bespoke fragrances'} and accentuates signature notes of ${product.topNotes || product.scentFamily || 'exclusive accords'} for ${targetOccasion}.`,
    layeringAdvice: `Layer delicately with a warm amber or sandalwood base oil to amplify the ${product.baseNotes || 'heart accords'}.`
  }));

  const primaryNote = favoriteNotes[0] || (scentFamilies[0] ? `${scentFamilies[0]} Accord` : "Royal Amber");
  const secondaryNote = favoriteNotes[1] || "Taif Rose";
  const baseNote = favoriteNotes[2] || "Oud Royale";

  const bespokeFormula = {
    name: `Elixir de ${primaryNote.toUpperCase()}`,
    description: `A masterfully formulated luxury concentrate crafted for ${targetOccasion}, blending top-tier ${primaryNote} with warm undercurrents of ${secondaryNote} and grounded by rare ${baseNote}.`,
    ingredients: [
      { noteName: `Pure ${primaryNote} Extract`, percentage: 40, role: "Top Note" },
      { noteName: `Artisanal ${secondaryNote} Essence`, percentage: 35, role: "Middle Note" },
      { noteName: `Aged ${baseNote} Oil`, percentage: 25, role: "Base Note" }
    ],
    careRitual: "Apply 2-3 drops to pulse points (wrists, neck, behind ears). Allow 10 minutes for peak maturation with natural skin warmth."
  };

  return {
    recommendations,
    bespokeFormula,
    notice: "Generated using RRV Perfume Rule Engine. Add GEMINI_API_KEY in AI Studio Secrets to unlock neural AI profiling."
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!getGenAI() });
});

// AI Scent Matchmaker endpoint
app.post("/api/scent-matchmaker", async (req, res) => {
  try {
    const { preferences, products } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: "Preferences are required." });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback to internal rule-based matchmaker when GEMINI_API_KEY is not set
      const fallbackResult = generateRuleBasedScentMatch(preferences, products);
      return res.json(fallbackResult);
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
      model: "gemini-3.6-flash",
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
    // If Gemini fails, fall back to rule-based scent matcher gracefully
    try {
      const fallbackResult = generateRuleBasedScentMatch(req.body.preferences, req.body.products);
      return res.json(fallbackResult);
    } catch (_) {
      res.status(500).json({ error: error.message || "An error occurred during matching." });
    }
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
