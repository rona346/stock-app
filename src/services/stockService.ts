import { StockData } from '../types';

const INITIAL_STOCKS: Omit<StockData, 'price' | 'change' | 'changePercent' | 'history'>[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'ITC', name: 'ITC Limited' },
];

const BASE_PRICES: Record<string, number> = {
  RELIANCE: 2950,
  TCS: 4100,
  INFY: 1650,
  HDFCBANK: 1450,
  ICICIBANK: 1080,
  WIPRO: 480,
  TATAMOTORS: 950,
  ADANIENT: 3200,
  SBIN: 780,
  ITC: 420,
};

export function generateInitialStockData(): StockData[] {
  return INITIAL_STOCKS.map(stock => {
    const basePrice = BASE_PRICES[stock.symbol];
    const history = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}:00`,
      price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05),
    }));
    const currentPrice = history[history.length - 1].price;
    const prevPrice = history[history.length - 2].price;
    const change = currentPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    return {
      ...stock,
      price: currentPrice,
      change,
      changePercent,
      history,
    };
  });
}

export function updateStockPrices(stocks: StockData[]): StockData[] {
  return stocks.map(stock => {
    const volatility = 0.005; // 0.5% max change per tick
    const change = stock.price * (Math.random() - 0.5) * volatility;
    const newPrice = Math.max(1, stock.price + change);
    const newChange = newPrice - stock.price;
    const newChangePercent = (newChange / stock.price) * 100;

    const newHistory = [...stock.history.slice(1), { 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
      price: newPrice 
    }];

    return {
      ...stock,
      price: newPrice,
      change: newChange,
      changePercent: newChangePercent,
      history: newHistory,
    };
  });
}
