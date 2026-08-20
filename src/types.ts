import { Timestamp } from './lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  createdAt: Timestamp;
}

export interface PortfolioItem {
  id?: string;
  uid: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastUpdated: Timestamp;
}

export interface Transaction {
  id?: string;
  uid: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Timestamp;
}

export interface WatchlistItem {
  uid: string;
  symbols: string[];
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: { time: string; price: number }[];
}

export interface AIRecommendation {
  symbol: string;
  name: string;
  confidence: number;
  reason: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}
