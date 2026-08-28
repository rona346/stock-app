import { StockData, AIRecommendation } from '../types';

export async function getAIRecommendation(
  stocks: StockData[]
): Promise<AIRecommendation> {
  const response = await fetch('/api/recommendation', {
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