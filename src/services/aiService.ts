import { StockData, AIRecommendation } from '../types';

export async function getAIRecommendation(stocks: StockData[]): Promise<AIRecommendation> {
  try {
    const response = await fetch('/api/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stocks }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AIRecommendation;
  } catch (error) {
    console.error("Client AI Recommendation Fetch Error:", error);
    
    // Fallback logic on client side if backend call fails
    if (stocks && stocks.length > 0) {
      const bestStock = stocks.reduce((prev, current) => (prev.changePercent > current.changePercent) ? prev : current);
      return {
        symbol: bestStock.symbol,
        name: bestStock.name,
        confidence: 75,
        reason: "Based on current positive momentum and price trend analysis (client-side fallback).",
        trend: "UP"
      };
    }
    
    return {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      confidence: 70,
      reason: "Fallback recommendation (client-side fallback).",
      trend: "UP"
    };
  }
}

