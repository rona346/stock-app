import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BrainCircuit,
  RefreshCw
} from 'lucide-react';

import {
  UserProfile,
  StockData,
  PortfolioItem,
  AIRecommendation
} from '../types';

import { StockCard } from '../components/StockCard';


const Dashboard: React.FC<{ 
  user: UserProfile | null; 
  stocks: StockData[]; 
  allStocks: StockData[];
  portfolio: PortfolioItem[];
  recommendation: AIRecommendation | null;
  onAutoInvest: () => void;
  loadingAI: boolean;
  onRefreshAI: () => void;
  watchlist: string[];
  onToggleWatchlist: (s: string) => void;
  onBuy: (s: StockData) => void;
  onSell: (s: StockData) => void;
  searchQuery: string;
}> = ({ user, stocks, allStocks, portfolio, recommendation, onAutoInvest,  onRefreshAI,loadingAI, watchlist, onToggleWatchlist, onBuy, onSell, searchQuery }) => {
  const totalInvested = portfolio.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  const currentValue = portfolio.reduce((acc, item) => {
    const stock = allStocks.find(s => s.symbol === item.symbol);
    return acc + (item.quantity * (stock?.price || 0));
  }, 0);
  const totalProfit = currentValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Market Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.displayName || 'Trader'}</p>
        </div>
        <div className="flex items-center space-x-3 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Market Live</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
              <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">Available</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Balance</p>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">₹{user?.balance.toLocaleString()}</h2>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Invested</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Portfolio Value</p>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">₹{currentValue.toLocaleString()}</h2>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
              {totalProfit >= 0 ? <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="w-6 h-6 text-rose-600 dark:text-rose-400" />}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'}`}>
              {totalProfit >= 0 ? 'Profit' : 'Loss'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Returns</p>
          <div className="flex items-baseline space-x-2">
            <h2 className={`text-3xl font-black mt-1 ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{Math.abs(totalProfit).toLocaleString()}
            </h2>
            <span className={`text-sm font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalProfit >= 0 ? '+' : '-'}{Math.abs(profitPercent).toFixed(2)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* AI Recommendation Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <BrainCircuit className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>

            <span className="font-bold tracking-wider uppercase text-xs opacity-80">
              AI Smart Recommendation
            </span>
          </div>

          <button
            onClick={onRefreshAI}
            disabled={loadingAI}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
            {loadingAI ? 'Analyzing...' : 'Refresh AI'}
          </button>
        </div>

          {loadingAI ? (
            <div className="flex items-center space-x-4">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xl font-bold">Analyzing market trends with Gemini AI...</p>
            </div>
          ) : recommendation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-4xl font-black mb-2">{recommendation.symbol}</h3>
                <p className="text-emerald-50 text-lg mb-4">{recommendation.name}</p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl">
                    <span className="text-sm opacity-80 block">Confidence</span>
                    <span className="text-xl font-black">{recommendation.confidence}%</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl">
                    <span className="text-sm opacity-80 block">Trend</span>
                    <span className="text-xl font-black">{recommendation.trend}</span>
                  </div>
                </div>
                <p className="text-emerald-50 leading-relaxed max-w-lg italic">"{recommendation.reason}"</p>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <button 
                  onClick={onAutoInvest}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-black py-4 px-10 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-3"
                >
                  <TrendingUp className="w-6 h-6" />
                  <span>Auto-Invest ₹1,00,000</span>
                </button>
                <p className="mt-4 text-xs text-emerald-100 opacity-60">AI-powered automated investment strategy</p>
              </div>
            </div>
          ) : (
            <p>No recommendation available at the moment.</p>
          )}
        </div>
      </div>

      {/* Search Results or Trending Stocks */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Trending Stocks'}
          </h2>
          {!searchQuery && (
            <Link to="/market" className="text-emerald-500 font-bold hover:underline">View All</Link>
          )}
        </div>
        
        {stocks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-[2rem] text-center border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No stocks found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(searchQuery ? stocks : stocks.slice(0, 4)).map(stock => (
              <StockCard 
                key={stock.symbol} 
                stock={stock} 
                isWatchlisted={watchlist.includes(stock.symbol)}
                onToggleWatchlist={onToggleWatchlist}
                onBuy={onBuy}
                onSell={onSell}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;