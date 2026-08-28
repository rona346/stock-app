import React from 'react';
import { StockData } from '../types';
import { StockCard } from '../components/StockCard';

const Market: React.FC<{ 
  stocks: StockData[]; 
  watchlist: string[]; 
  onToggleWatchlist: (s: string) => void;
  onBuy: (s: StockData, quantity: number) => void;
  onSell: (s: StockData, quantity: number) => void;
}> = ({ stocks, watchlist, onToggleWatchlist, onBuy, onSell }) => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Stock Market</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time simulated market data for top Indian stocks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stocks.map(stock => (
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
    </div>
  );
};

export default Market;