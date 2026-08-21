import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PieChart } from 'lucide-react';

import { StockData, PortfolioItem } from '../types';

const Portfolio: React.FC<{ 
  stocks: StockData[]; 
  portfolio: PortfolioItem[];
  onSell: (s: StockData) => void;
}> = ({ stocks, portfolio, onSell }) => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Portfolio</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your investments and performance.</p>
      </div>

      {portfolio.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-12 text-center border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PieChart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Investments Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">Start building your portfolio by exploring the market and buying stocks.</p>
          <Link to="/market" className="inline-block mt-8 bg-emerald-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-emerald-500/20">
            Explore Market
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {portfolio.map(item => {
            const stock = stocks.find(s => s.symbol === item.symbol);
            if (!stock) return null;
            const currentVal = item.quantity * stock.price;
            const investedVal = item.quantity * item.averagePrice;
            const profit = currentVal - investedVal;
            const isProfit = profit >= 0;

            return (
              <motion.div 
                key={item.symbol}
                layout
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-xl font-black text-gray-900 dark:text-white">
                    {item.symbol[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{item.symbol}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} Shares</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Price</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">₹{item.averagePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Price</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">₹{stock.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invested</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">₹{investedVal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Returns</p>
                    <p className={`text-lg font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isProfit ? '+' : ''}₹{profit.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => onSell(stock)}
                    className="flex-1 md:flex-none py-3 px-8 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-500/20"
                  >
                    Sell All
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Portfolio;