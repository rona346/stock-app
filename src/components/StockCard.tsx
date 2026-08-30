import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { StockData } from "../types";
import { StockChart } from "./StockChart";

interface StockCardProps {
  stock: StockData;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onBuy: (stock: StockData, quantity: number) => void;
  onSell: (stock: StockData, quantity: number) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  isWatchlisted,
  onToggleWatchlist,
  onBuy,
  onSell,
}) => {
  const isPositive = stock.change >= 0;
  const [quantity, setQuantity] = useState<string>("1");
  const selectedQuantity = quantity === "" ? 0 : Number(quantity);
  const color = isPositive ? "#10b981" : "#ef4444";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {stock.symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stock.name}
          </p>
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

      <div className="flex items-start justify-between mb-6 min-w-0">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
            ₹{stock.price.toFixed(2)}
          </p>

          <div
            className={`flex items-center text-sm font-medium ${
              isPositive ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1 shrink-0" />
            )}
            {isPositive ? "+" : ""}
            {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </div>
        </div>

        <div className="w-16 h-12 shrink-0 overflow-hidden ml-2">
          <StockChart data={stock.history} color={color} height={48} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Quantity
        </label>

        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
          }}
          className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            const qty = Number(quantity);

            if (!Number.isInteger(qty) || qty <= 0) {
              alert("Quantity must be a whole number greater than 0.");
              return;
            }

            onBuy(stock, qty);
          }}
          className="flex items-center justify-center py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy
        </button>

        <button
          onClick={() => {
            const qty = Number(quantity);

            if (!Number.isInteger(qty) || qty <= 0) {
              alert("Quantity must be a whole number greater than 0.");
              return;
            }

            onSell(stock, qty);
          }}
          className="flex items-center justify-center py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Sell
        </button>
      </div>
    </motion.div>
  );
};
