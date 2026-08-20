import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as yahooFinanceModule from 'yahoo-finance2';
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGoogleGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Access YahooFinance from the module, handling different import styles
const YahooFinance = (yahooFinanceModule as any).YahooFinance || (yahooFinanceModule as any).default?.YahooFinance || (yahooFinanceModule as any).default;

let yahooFinance: any;
try {
  if (typeof YahooFinance === 'function') {
    yahooFinance = new YahooFinance();
    console.log("YahooFinance initialized as a class instance.");
  } else {
    yahooFinance = YahooFinance;
    console.log("YahooFinance used as a direct module export.");
  }
} catch (e) {
  console.error("Failed to initialize YahooFinance:", e);
}

const fallbackStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 2950 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', basePrice: 4100 },
  { symbol: 'INFY', name: 'Infosys', basePrice: 1650 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', basePrice: 1450 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', basePrice: 1080 },
  { symbol: 'WIPRO', name: 'Wipro', basePrice: 480 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', basePrice: 950 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', basePrice: 3200 },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 780 },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 420 },
];

function generateSimulatedStocks() {
  return fallbackStocks.map(stock => {
    const history = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000);
      const rand = Math.sin(i + stock.basePrice) * 0.02 + (Math.random() - 0.5) * 0.01;
      return {
        time: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        price: Number((stock.basePrice * (1 + rand)).toFixed(2))
      };
    });
    
    const currentPrice = history[history.length - 1].price;
    const prevPrice = history[history.length - 2].price;
    const change = Number((currentPrice - prevPrice).toFixed(2));
    const changePercent = Number(((change / prevPrice) * 100).toFixed(2));

    return {
      symbol: stock.symbol,
      name: stock.name,
      price: currentPrice,
      change,
      changePercent,
      history
    };
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support parsing JSON request bodies
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route for AI Recommendation
  app.post("/api/recommendation", async (req, res) => {
    const { stocks } = req.body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: "Invalid stock data provided" });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not configured on the server. Falling back to momentum-based recommendation.");
        throw new Error("GEMINI_API_KEY is missing");
      }

      const ai = getGoogleGenAI();
      const stockSummary = stocks.map((s: any) => `${s.symbol} (${s.name}): Price ₹${s.price.toFixed(2)}, Change ${s.changePercent.toFixed(2)}%`).join('\n');

      const prompt = `
        Analyze the following stock data and provide a single recommendation for the best stock to invest in right now.
        Current Market Data:
        ${stockSummary}

        Provide your response in JSON format with the following structure:
        {
          "symbol": "STOCK_SYMBOL",
          "name": "STOCK_NAME",
          "confidence": 0-100,
          "reason": "Short explanation of why this stock is recommended",
          "trend": "UP" | "DOWN" | "STABLE"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ["UP", "DOWN", "STABLE"] }
            },
            required: ["symbol", "name", "confidence", "reason", "trend"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini AI");
      }

      const recommendation = JSON.parse(response.text);
      res.json(recommendation);
    } catch (error) {
      console.error("Server AI Recommendation Error:", error);
      
      // Fallback logic if AI fails or key is missing
      const bestStock = stocks.reduce((prev: any, current: any) => (prev.changePercent > current.changePercent) ? prev : current);
      res.json({
        symbol: bestStock.symbol,
        name: bestStock.name,
        confidence: 75,
        reason: "Based on current positive momentum and price trend analysis (server-side fallback).",
        trend: "UP"
      });
    }
  });

  // API Route for real stock data
  app.get("/api/stocks", async (req, res) => {
    console.log("Fetching stock data for symbols...");
    const symbols = [
      'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 
      'WIPRO.NS', 'HCLTECH.NS', 'ADANIENT.NS', 'SBIN.NS', 'ITC.NS'
    ];

    try {
      const results = await Promise.all(symbols.map(async (symbol) => {
        try {
          // Use the quote method directly from the default export
          const quote: any = await yahooFinance.quote(symbol);
          const history: any[] = await yahooFinance.historical(symbol, {
            period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            period2: new Date().toISOString().split('T')[0],
            interval: '1d'
          });

          return {
            symbol: symbol.replace('.NS', ''),
            name: quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            history: history.map((h: any) => ({
              time: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              price: h.close
            }))
          };
        } catch (err) {
          console.warn(`Failed to fetch data for ${symbol}:`, err instanceof Error ? err.message : err);
          return null;
        }
      }));

      // Filter out failed fetches
      const validResults = results.filter(r => r !== null);
      if (validResults.length > 0) {
        res.json(validResults);
      } else {
        console.warn("All Yahoo Finance fetches failed or empty, returning simulated stock data fallback.");
        res.json(generateSimulatedStocks());
      }
    } catch (error) {
      console.error("Stock API Error:", error);
      res.json(generateSimulatedStocks());
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR to prevent WebSocket errors in this environment
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();
