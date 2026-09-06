import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
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
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

async function startServer() {
  const app = express();

  const PORT = Number(process.env.PORT) || 3000;

  // Parse JSON request bodies
  app.use(express.json());

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  // ============================================================
  // AI RECOMMENDATION
  // ============================================================

  app.post("/api/recommendation", async (req, res) => {
    const { stocks } = req.body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({
        error: "Invalid stock data provided",
      });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const ai = getGoogleGenAI();

      const stockSummary = stocks
        .map(
          (s: any) =>
            `${s.symbol} (${s.name}): Price ₹${Number(s.price).toFixed(
              2,
            )}, Change ${Number(s.changePercent).toFixed(2)}%`,
        )
        .join("\n");

      const prompt = `
Analyze the following stock data and provide a single recommendation
for the best stock to invest in right now.

Current Market Data:

${stockSummary}

Provide your response in JSON format with this structure:

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
              symbol: {
                type: Type.STRING,
              },

              name: {
                type: Type.STRING,
              },

              confidence: {
                type: Type.NUMBER,
              },

              reason: {
                type: Type.STRING,
              },

              trend: {
                type: Type.STRING,

                enum: ["UP", "DOWN", "STABLE"],
              },
            },

            required: ["symbol", "name", "confidence", "reason", "trend"],
          },
        },
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini AI");
      }

      const recommendation = JSON.parse(response.text);

      return res.json(recommendation);
    } catch (error: any) {
      console.error("Server AI Recommendation Error:", error);

      const status = error?.status ?? error?.error?.code;

      if (status === 429) {
        return res.status(429).json({
          error: "Gemini API quota exceeded. Please try again later.",
        });
      }

      if (status === 401 || status === 403) {
        return res.status(status).json({
          error:
            "Gemini API authentication/permission error. Check GEMINI_API_KEY.",
        });
      }

      return res.status(502).json({
        error: "Gemini AI recommendation failed.",
      });
    }
  });

  // ============================================================
  // STOCK DATA - ALPHA VANTAGE
  // ============================================================

  type StockConfig = {
    symbol: string;
    displaySymbol: string;
    name: string;
  };

  type StockResult = {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    history: {
      time: string;
      price: number;
    }[];
    dataDate: string;
  };

  const stocks: StockConfig[] = [
    {
      symbol: "RELIANCE.BSE",
      displaySymbol: "RELIANCE",
      name: "Reliance Industries",
    },
    {
      symbol: "TCS.BSE",
      displaySymbol: "TCS",
      name: "Tata Consultancy Services",
    },
    {
      symbol: "INFY.BSE",
      displaySymbol: "INFY",
      name: "Infosys",
    },
    {
      symbol: "HDFCBANK.BSE",
      displaySymbol: "HDFCBANK",
      name: "HDFC Bank",
    },
    {
      symbol: "ICICIBANK.BSE",
      displaySymbol: "ICICIBANK",
      name: "ICICI Bank",
    },
    {
      symbol: "WIPRO.BSE",
      displaySymbol: "WIPRO",
      name: "Wipro",
    },
    {
      symbol: "HCLTECH.BSE",
      displaySymbol: "HCLTECH",
      name: "HCL Technologies",
    },
    {
      symbol: "ADANIENT.BSE",
      displaySymbol: "ADANIENT",
      name: "Adani Enterprises",
    },
    {
      symbol: "SBIN.BSE",
      displaySymbol: "SBIN",
      name: "State Bank of India",
    },
    {
      symbol: "ITC.BSE",
      displaySymbol: "ITC",
      name: "ITC Limited",
    },
  ];

  // ==========================================================
  // STOCK API CACHE + QUOTA PROTECTION
  // ==========================================================

  let stocksCache: {
    data: StockResult[];
    timestamp: number;
  } | null = null;

  // Alpha Vantage free tier protection.
  // 10 stocks per refresh = 10 requests.
  // Keep a safety margin below the 25 requests/day limit.
  const MAX_DAILY_ALPHA_VANTAGE_REQUESTS = 20;

  let alphaVantageUsage = {
    date: new Date().toISOString().slice(0, 10),
    requests: 0,
  };

  // Prevent multiple simultaneous /api/stocks requests
  // from triggering duplicate Alpha Vantage calls.
  let stockRefreshPromise: Promise<StockResult[]> | null = null;

  // Keep real data for 12 hours before attempting another full refresh.
  // This prevents the frontend from repeatedly consuming the quota.
  const CACHE_DURATION = 12 * 60 * 60 * 1000;

  const resetDailyUsageIfNeeded = () => {
    const today = new Date().toISOString().slice(0, 10);

    if (alphaVantageUsage.date !== today) {
      alphaVantageUsage = {
        date: today,
        requests: 0,
      };
    }
  };

  const refreshStocksFromAlphaVantage = async (
    apiKey: string,
  ): Promise<StockResult[]> => {
    resetDailyUsageIfNeeded();

    // Never start a refresh if we don't have enough daily budget
    // for the complete 10-stock refresh.
    if (
      alphaVantageUsage.requests + stocks.length >
      MAX_DAILY_ALPHA_VANTAGE_REQUESTS
    ) {
      throw new Error(
        `Alpha Vantage daily safety budget reached. Used ${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS} requests.`,
      );
    }

    const results: StockResult[] = [];

    for (const stock of stocks) {
      try {
        console.log(`Fetching ${stock.displaySymbol} from Alpha Vantage...`);

        const url =
          "https://www.alphavantage.co/query" +
          `?function=TIME_SERIES_DAILY` +
          `&symbol=${encodeURIComponent(stock.symbol)}` +
          `&outputsize=compact` +
          `&apikey=${encodeURIComponent(apiKey)}`;

        // Count every actual Alpha Vantage request.
        alphaVantageUsage.requests += 1;

        // Alpha Vantage free tier requires requests to be spaced out.
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Alpha Vantage HTTP error: ${response.status}`);
        }

        const data: any = await response.json();

        if (data["Error Message"]) {
          throw new Error(data["Error Message"]);
        }

        if (data["Note"]) {
          throw new Error(data["Note"]);
        }

        if (data["Information"]) {
          console.error(
            `Alpha Vantage rejected ${stock.symbol}: API usage/rate limit or provider restriction.`,
          );
          throw new Error(
            `Alpha Vantage rejected the request for ${stock.symbol}.`,
          );
        }

        const timeSeries = data["Time Series (Daily)"];

        if (!timeSeries) {
          console.error(
            `Alpha Vantage returned no time-series data for ${stock.symbol}`,
          );

          throw new Error(
            `No daily time-series data returned for ${stock.symbol}`,
          );
        }

        const entries = Object.entries(timeSeries)
          .sort(
            ([dateA], [dateB]) =>
              new Date(dateA).getTime() - new Date(dateB).getTime(),
          )
          .slice(-7);

        if (entries.length === 0) {
          throw new Error(`No historical data for ${stock.symbol}`);
        }

        const history = entries.map(([date, values]: any) => ({
          time: date,
          price: Number(values["4. close"]),
        }));

        const latest = history[history.length - 1];

        const previous =
          history.length >= 2 ? history[history.length - 2] : latest;

        const change = Number((latest.price - previous.price).toFixed(2));

        const changePercent =
          previous.price !== 0
            ? Number(((change / previous.price) * 100).toFixed(2))
            : 0;

        results.push({
          symbol: stock.displaySymbol,
          name: stock.name,
          price: latest.price,
          change,
          changePercent,
          history,
          dataDate: latest.time,
        });

        console.log(
          `Successfully fetched ${stock.displaySymbol} - ${latest.time}`,
        );
      } catch (error) {
        console.error(
          `Failed to fetch ${stock.displaySymbol}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log(
      `Alpha Vantage usage today: ${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS}`,
    );

    if (results.length === 0) {
      throw new Error("Unable to fetch any stock data from Alpha Vantage.");
    }

    return results;
  };

  app.get("/api/stocks", async (req, res) => {
    const apiKey = process.env.STOCK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "STOCK_API_KEY is not configured on the server.",
      });
    }

    resetDailyUsageIfNeeded();

    // ==========================================================
    // RETURN REAL CACHED DATA
    // ==========================================================

    if (stocksCache && Date.now() - stocksCache.timestamp < CACHE_DURATION) {
      console.log("Returning cached REAL stock data.");

      return res.json(stocksCache.data);
    }

    // ==========================================================
    // PREVENT DUPLICATE REFRESHES
    // ==========================================================

    if (stockRefreshPromise) {
      console.log(
        "Stock refresh already in progress. Waiting for existing request...",
      );

      try {
        const data = await stockRefreshPromise;
        return res.json(data);
      } catch (error) {
        return res.status(502).json({
          error:
            error instanceof Error ? error.message : "Stock refresh failed.",
        });
      }
    }

    // ==========================================================
    // START ONE CONTROLLED REFRESH
    // ==========================================================

    stockRefreshPromise = refreshStocksFromAlphaVantage(apiKey);

    try {
      const results = await stockRefreshPromise;

      // Only replace the cache when we received a valid result.
      // This prevents a failed refresh from destroying
      // previously cached REAL data.
      stocksCache = {
        data: results,
        timestamp: Date.now(),
      };

      console.log(
        `Stock refresh complete: ${results.length}/${stocks.length} stocks`,
      );

      return res.json(results);
    } catch (error) {
      console.error(
        "Stock refresh failed:",
        error instanceof Error ? error.message : error,
      );

      // If we already have REAL cached data, return it.
      // Never generate fake/simulated prices.
      if (stocksCache) {
        console.log("Returning previously cached REAL stock data.");

        return res.json(stocksCache.data);
      }

      return res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch stock data from Alpha Vantage.",
      });
    } finally {
      stockRefreshPromise = null;
    }
  });
  // ============================================================
  // VITE
  // ============================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,

        // Disable HMR WebSocket
        hmr: false,
      },

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

  // ============================================================
  // START SERVER
  // ============================================================

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
