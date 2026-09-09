import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
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

  // CORS: Allow only the StockAI Vercel production origin (and local dev origins when not in production)
  const allowedOrigins = [
    "https://stock-app-fawn-three.vercel.app",
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      if (
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== "production" &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
      }
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

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

  // Opportunistic runtime cache file on ephemeral disk.
  // Never manually pre-seeded; only stores real data returned by Alpha Vantage.
  const CACHE_FILE_PATH = path.join(process.cwd(), "stocks-cache.json");

  // In-memory per-symbol real stock cache
  const cachedStocksMap = new Map<string, StockResult>();
  let cacheLastUpdated = 0;

  // Alpha Vantage free tier protection: 25 requests/day total limit.
  // We keep a safety budget limit of 24.
  const MAX_DAILY_ALPHA_VANTAGE_REQUESTS = 24;

  let alphaVantageUsage = {
    date: new Date().toISOString().slice(0, 10),
    requests: 0,
  };

  // Prevent multiple simultaneous /api/stocks requests
  // from triggering duplicate Alpha Vantage calls.
  let stockRefreshPromise: Promise<void> | null = null;

  // Cache real daily market data for 24 hours.
  // BSE daily closing prices only update once per trading day.
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  const resetDailyUsageIfNeeded = () => {
    const today = new Date().toISOString().slice(0, 10);

    if (alphaVantageUsage.date !== today) {
      alphaVantageUsage = {
        date: today,
        requests: 0,
      };
    }
  };

  const loadRuntimeCacheFromDisk = () => {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.data)) {
          for (const item of parsed.data) {
            if (item && item.symbol && typeof item.price === "number") {
              cachedStocksMap.set(item.symbol, item);
            }
          }
          cacheLastUpdated = Number(parsed.timestamp) || 0;
          const today = new Date().toISOString().slice(0, 10);
          if (
            parsed.usage?.date === today &&
            typeof parsed.usage.requests === "number"
          ) {
            alphaVantageUsage.requests = Math.max(
              alphaVantageUsage.requests,
              parsed.usage.requests,
            );
          }
          console.log(
            `Loaded ${cachedStocksMap.size} real stocks from runtime cache file.`,
          );
        }
      }
    } catch (err) {
      console.warn(
        "Could not load runtime cache file:",
        err instanceof Error ? err.message : err,
      );
    }
  };

  const saveRuntimeCacheToDisk = () => {
    try {
      const payload = {
        data: Array.from(cachedStocksMap.values()),
        timestamp: cacheLastUpdated,
        usage: alphaVantageUsage,
      };
      fs.writeFileSync(
        CACHE_FILE_PATH,
        JSON.stringify(payload, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.warn(
        "Could not save runtime cache file:",
        err instanceof Error ? err.message : err,
      );
    }
  };

  // Attempt to load runtime cache from disk on startup if available
  loadRuntimeCacheFromDisk();

  const refreshStocksFromAlphaVantage = async (
    apiKey: string,
  ): Promise<void> => {
    resetDailyUsageIfNeeded();

    // Check if we have daily safety budget left
    if (alphaVantageUsage.requests >= MAX_DAILY_ALPHA_VANTAGE_REQUESTS) {
      throw new Error(
        `Alpha Vantage daily safety budget reached. Used ${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS} requests.`,
      );
    }

    let newlyFetchedCount = 0;

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      // Stop if budget is reached during the loop
      if (alphaVantageUsage.requests >= MAX_DAILY_ALPHA_VANTAGE_REQUESTS) {
        console.warn(
          `Daily Alpha Vantage budget reached (${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS}). Halting refresh.`,
        );
        break;
      }

      try {
        // Obey Alpha Vantage free tier frequency limit (5 requests per minute).
        // 12.5s delay between requests guarantees < 5 calls/min and avoids "Note" rate limits.
        if (i > 0) {
          console.log(
            "Waiting 12.5s to respect Alpha Vantage 5 calls/min rate limit...",
          );
          await new Promise((resolve) => setTimeout(resolve, 12500));
        }

        console.log(`Fetching ${stock.displaySymbol} from Alpha Vantage...`);

        const url =
          "https://www.alphavantage.co/query" +
          `?function=TIME_SERIES_DAILY` +
          `&symbol=${encodeURIComponent(stock.symbol)}` +
          `&outputsize=compact` +
          `&apikey=${encodeURIComponent(apiKey)}`;

        // Count every actual Alpha Vantage request.
        alphaVantageUsage.requests += 1;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Alpha Vantage HTTP error: ${response.status}`);
        }

        const data: any = await response.json();

        if (data["Error Message"]) {
          console.error(
            `Alpha Vantage error response received for ${stock.displaySymbol}.`,
          );
          throw new Error(
            `Alpha Vantage rejected request for ${stock.displaySymbol}.`,
          );
        }

        if (data["Note"]) {
          console.error(
            `Alpha Vantage rate limit notice received for ${stock.displaySymbol}.`,
          );
          throw new Error(
            `Alpha Vantage rate limit reached for ${stock.displaySymbol}.`,
          );
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

        const stockResult: StockResult = {
          symbol: stock.displaySymbol,
          name: stock.name,
          price: latest.price,
          change,
          changePercent,
          history,
          dataDate: latest.time,
        };

        // Per-symbol cache update: update this symbol without touching others
        cachedStocksMap.set(stock.displaySymbol, stockResult);
        cacheLastUpdated = Date.now();
        saveRuntimeCacheToDisk();
        newlyFetchedCount++;

        console.log(
          `Successfully fetched ${stock.displaySymbol} - ${latest.time}`,
        );
      } catch (error) {
        // Individual symbol failure must NOT destroy other symbols or previously cached data
        console.error(
          `Failed to fetch ${stock.displaySymbol}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log(
      `Alpha Vantage usage today: ${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS}. Real stocks in cache: ${cachedStocksMap.size}/${stocks.length}`,
    );

    saveRuntimeCacheToDisk();

    if (cachedStocksMap.size === 0 && newlyFetchedCount === 0) {
      throw new Error("Unable to fetch any stock data from Alpha Vantage.");
    }
  };

  app.get("/api/stocks", async (req, res) => {
    const apiKey = process.env.STOCK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "STOCK_API_KEY is not configured on the server.",
      });
    }

    resetDailyUsageIfNeeded();

    const now = Date.now();
    const isFresh =
      cachedStocksMap.size === stocks.length &&
      now - cacheLastUpdated < CACHE_DURATION;

    // ==========================================================
    // 1. RETURN FRESH REAL CACHED DATA
    // ==========================================================
    if (isFresh) {
      console.log("Returning fresh cached REAL stock data.");
      return res.json(Array.from(cachedStocksMap.values()));
    }

    // ==========================================================
    // 2. STALE REAL DATA FALLBACK IF DAILY BUDGET EXHAUSTED
    // ==========================================================
    if (
      alphaVantageUsage.requests >= MAX_DAILY_ALPHA_VANTAGE_REQUESTS &&
      cachedStocksMap.size > 0
    ) {
      console.warn(
        `Alpha Vantage daily safety budget reached (${alphaVantageUsage.requests}/${MAX_DAILY_ALPHA_VANTAGE_REQUESTS}). Serving existing REAL stock data.`,
      );
      return res.json(Array.from(cachedStocksMap.values()));
    }

    // ==========================================================
    // 3. PREVENT DUPLICATE REFRESHES & SERVE IMMEDIATE REAL DATA
    // ==========================================================
    if (stockRefreshPromise) {
      // If we already have real cached data, serve it immediately rather than making the client wait
      if (cachedStocksMap.size > 0) {
        console.log(
          "Stock refresh in progress. Serving existing REAL stock data immediately.",
        );
        return res.json(Array.from(cachedStocksMap.values()));
      }

      console.log(
        "Stock refresh already in progress on cold start. Waiting for existing request...",
      );

      try {
        await stockRefreshPromise;
      } catch (error) {
        // Handled below
      }

      if (cachedStocksMap.size > 0) {
        return res.json(Array.from(cachedStocksMap.values()));
      }

      return res.status(502).json({
        error: "Stock refresh failed.",
      });
    }

    // ==========================================================
    // 4. START ONE CONTROLLED REFRESH
    // ==========================================================
    stockRefreshPromise = refreshStocksFromAlphaVantage(apiKey);

    try {
      await stockRefreshPromise;

      if (cachedStocksMap.size > 0) {
        console.log(
          `Serving real stocks: ${cachedStocksMap.size}/${stocks.length} available`,
        );
        return res.json(Array.from(cachedStocksMap.values()));
      }

      return res.status(502).json({
        error: "Unable to fetch stock data from Alpha Vantage.",
      });
    } catch (error) {
      console.error(
        "Stock refresh failed:",
        error instanceof Error ? error.message : error,
      );

      // Stale real data fallback: never return 502 if any real stock data exists
      if (cachedStocksMap.size > 0) {
        console.log(
          "Returning previously cached REAL stock data after refresh error.",
        );
        return res.json(Array.from(cachedStocksMap.values()));
      }

      return res.status(502).json({
        error: "Unable to fetch stock data from Alpha Vantage.",
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
