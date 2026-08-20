import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Star, StarOff, ShoppingCart, DollarSign } from 'lucide-react';
import { StockData } from '../types';
import { StockChart } from './StockChart';

interface StockCardProps {
  stock: StockData;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onBuy: (stock: StockData) => void;
  onSell: (stock: StockData) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, isWatchlisted, onToggleWatchlist, onBuy, onSell }) => {
  const isPositive = stock.change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{stock.symbol}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</p>
        </div>
        <button 
          onClick={() => onToggleWatchlist(stock.symbol)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isWatchlisted ? (
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          ) : (
            <StarOff className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stock.price.toFixed(2)}</p>
          <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="w-32 h-12">
          <StockChart data={stock.history} color={color} height={48} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => onBuy(stock)}
          className="flex items-center justify-center py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy
        </button>
        <button 
          onClick={() => onSell(stock)}
          className="flex items-center justify-center py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Sell
        </button>
      </div>
    </motion.div>
  );
};
