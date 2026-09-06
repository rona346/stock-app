import { StockData, AIRecommendation } from '../types';

export async function getAIRecommendation(
  stocks: StockData[]
): Promise<AIRecommendation> {
  const backendUrl = (process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  const response = await fetch(`${backendUrl}/api/recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stocks }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.error ||
      `AI recommendation failed with status ${response.status}`
    );
  }

  return (await response.json()) as AIRecommendation;
}