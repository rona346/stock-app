import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, Timestamp, signOut, signInWithPopup, googleProvider, onSnapshot, query, collection, where, addDoc, deleteDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from './lib/firebase';
import { UserProfile, StockData, WatchlistItem, PortfolioItem, Transaction, AIRecommendation } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { generateInitialStockData, updateStockPrices } from './services/stockService';
import { getAIRecommendation } from './services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { StockCard } from './components/StockCard';
import { StockChart } from './components/StockChart';
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

// --- Pages ---

const Dashboard: React.FC<{ 
  user: UserProfile | null; 
  stocks: StockData[]; 
  allStocks: StockData[];
  portfolio: PortfolioItem[];
  recommendation: AIRecommendation | null;
  onAutoInvest: () => void;
  loadingAI: boolean;
  watchlist: string[];
  onToggleWatchlist: (s: string) => void;
  onBuy: (s: StockData) => void;
  onSell: (s: StockData) => void;
  searchQuery: string;
}> = ({ user, stocks, allStocks, portfolio, recommendation, onAutoInvest, loadingAI, watchlist, onToggleWatchlist, onBuy, onSell, searchQuery }) => {
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
          <div className="flex items-center space-x-2 mb-6">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <span className="font-bold tracking-wider uppercase text-xs opacity-80">AI Smart Recommendation</span>
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

const Market: React.FC<{ 
  stocks: StockData[]; 
  watchlist: string[]; 
  onToggleWatchlist: (s: string) => void;
  onBuy: (s: StockData) => void;
  onSell: (s: StockData) => void;
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

const Orders: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Order History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View all your past buy and sell transactions.</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-12 text-center border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Orders Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">You haven't made any trades yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tx.timestamp.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      {tx.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tx.type === 'BUY' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tx.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{tx.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(tx.quantity * tx.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL) {
            const updatedUser = { ...userData, photoURL: firebaseUser.photoURL };
            await setDoc(doc(db, 'users', firebaseUser.uid), { photoURL: firebaseUser.photoURL }, { merge: true });
            setUser(updatedUser);
          } else {
            setUser(userData);
          }
        } else {
          // Create user doc if it doesn't exist (for Google Sign-In)
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            balance: 100000,
            createdAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch User Data (Portfolio, Watchlist)
  useEffect(() => {
    if (!user) return;

    const unsubWatchlist = onSnapshot(doc(db, 'watchlists', user.uid), (doc) => {
      if (doc.exists()) {
        setWatchlist(doc.data().symbols || []);
      }
    });

    const unsubPortfolio = onSnapshot(
      query(collection(db, 'portfolios'), where('uid', '==', user.uid)),
      (snapshot) => {
        const items: PortfolioItem[] = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as PortfolioItem));
        setPortfolio(items);
      }
    );

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('uid', '==', user.uid)),
      (snapshot) => {
        const items: Transaction[] = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Transaction));
        // Sort by timestamp descending
        items.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        setTransactions(items);
      }
    );

    return () => {
      unsubWatchlist();
      unsubPortfolio();
      unsubTransactions();
    };
  }, [user]);

  // Stock Data Fetching (Real Market Prices)
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/stocks');
        if (!response.ok) throw new Error('Failed to fetch stocks');
        const data = await response.json();
        
        if (data && data.length > 0) {
          setStocks(data);
        } else {
          console.warn("Stock API returned empty data, falling back to simulation.");
          if (stocks.length === 0) {
            setStocks(generateInitialStockData());
          }
        }
      } catch (error) {
        console.error("Stock Fetch Error:", error);
        // Fallback to simulation if API fails
        if (stocks.length === 0) {
          setStocks(generateInitialStockData());
        }
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // AI Recommendation Trigger
  useEffect(() => {
    if (!user) return;
    
    const fetchAI = async () => {
      setLoadingAI(true);
      const rec = await getAIRecommendation(stocks);
      setRecommendation(rec);
      setLoadingAI(false);
    };

    fetchAI();
    const aiInterval = setInterval(fetchAI, 60000); // Update AI every minute
    return () => clearInterval(aiInterval);
  }, [user]);

  // Handlers
  const handleAuth = async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    try {
      if (authType === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;
        
        if (name) {
          await updateProfile(firebaseUser, { displayName: name });
        }

        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          displayName: name || firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          balance: 100000,
          createdAt: Timestamp.now()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (error) {
      // Set user-friendly error state instead of polluting system logs with expected user errors
      const errMsg = error instanceof Error ? error.message : String(error);
      const friendlyMsg = errMsg.replace("Firebase: ", "").replace("auth/", "");
      setAuthError(friendlyMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const friendlyMsg = errMsg.replace("Firebase: ", "").replace("auth/", "");
      setAuthError(friendlyMsg);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleWatchlist = async (symbol: string) => {
    if (!user) return;
    const newWatchlist = watchlist.includes(symbol) 
      ? watchlist.filter(s => s !== symbol) 
      : [...watchlist, symbol];
    
    await setDoc(doc(db, 'watchlists', user.uid), { uid: user.uid, symbols: newWatchlist });
  };

  const handleBuy = async (stock: StockData, amount: number = 1) => {
    if (!user || user.balance < stock.price * amount) {
      alert("Insufficient balance!");
      return;
    }

    const totalCost = stock.price * amount;
    const newBalance = user.balance - totalCost;

    // Update User Balance
    await setDoc(doc(db, 'users', user.uid), { ...user, balance: newBalance });
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);

    // Update Portfolio
    const existing = portfolio.find(p => p.symbol === stock.symbol);
    if (existing) {
      const newQty = existing.quantity + amount;
      const newAvg = ((existing.quantity * existing.averagePrice) + totalCost) / newQty;
      await setDoc(doc(db, 'portfolios', existing.id!), { 
        ...existing, 
        quantity: newQty, 
        averagePrice: newAvg,
        lastUpdated: Timestamp.now()
      });
    } else {
      await addDoc(collection(db, 'portfolios'), {
        uid: user.uid,
        symbol: stock.symbol,
        quantity: amount,
        averagePrice: stock.price,
        lastUpdated: Timestamp.now()
      });
    }

    // Record Transaction
    const buyTx = {
      uid: user.uid,
      symbol: stock.symbol,
      type: 'BUY',
      quantity: amount,
      price: stock.price,
      timestamp: Timestamp.now()
    };
    await addDoc(collection(db, 'transactions'), buyTx);
    setNotifications(prev => [`Successfully purchased ${amount} shares of ${stock.symbol} at ₹${stock.price.toFixed(2)}`, ...prev]);
  };

  const handleSell = async (stock: StockData) => {
    if (!user) return;
    const existing = portfolio.find(p => p.symbol === stock.symbol);
    if (!existing || existing.quantity <= 0) return;

    const totalGain = stock.price * existing.quantity;
    const newBalance = user.balance + totalGain;

    // Update User Balance
    await setDoc(doc(db, 'users', user.uid), { ...user, balance: newBalance });
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);

    // Remove from Portfolio
    await deleteDoc(doc(db, 'portfolios', existing.id!));

    // Record Transaction
    const sellTx = {
      uid: user.uid,
      symbol: stock.symbol,
      type: 'SELL',
      quantity: existing.quantity,
      price: stock.price,
      timestamp: Timestamp.now()
    };
    await addDoc(collection(db, 'transactions'), sellTx);
    setNotifications(prev => [`Successfully sold ${existing.quantity} shares of ${stock.symbol} at ₹${stock.price.toFixed(2)}`, ...prev]);
  };

  const handleAutoInvest = async () => {
    if (!user || !recommendation) return;
    const stock = stocks.find(s => s.symbol === recommendation.symbol);
    if (!stock) return;

    const investAmount = 100000;
    if (user.balance < investAmount) {
      alert("Insufficient balance for auto-invest!");
      return;
    }

    const qty = Math.floor(investAmount / stock.price);
    if (qty <= 0) return;

    await handleBuy(stock, qty);
    alert(`Auto-invested in ${stock.symbol}: Purchased ${qty} shares!`);
  };

  const filteredStocks = (stocks || []).filter(stock => {
    if (!stock) return false;
    const symbol = String(stock.symbol || '').toLowerCase();
    const name = String(stock.name || '').toLowerCase();
    const query = String(searchQuery || '').toLowerCase();
    return symbol.includes(query) || name.includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm 
        type={authType}
        onSubmit={handleAuth}
        onGoogleSignIn={handleGoogleSignIn}
        onSwitch={() => {
          setAuthError(null);
          setAuthType(prev => prev === 'login' ? 'signup' : 'login');
        }}
        error={authError}
      />
    );
  }

  return (
    <Router>
      <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <Sidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <Navbar 
            user={user} 
            isDarkMode={isDarkMode} 
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            notifications={notifications}
            onClearNotifications={() => setNotifications([])}
            onLogout={handleLogout}
          />
          
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <Dashboard 
                    user={user} 
                    stocks={filteredStocks} 
                    allStocks={stocks}
                    portfolio={portfolio} 
                    recommendation={recommendation}
                    onAutoInvest={handleAutoInvest}
                    loadingAI={loadingAI}
                    watchlist={watchlist}
                    onToggleWatchlist={toggleWatchlist}
                    onBuy={(s) => handleBuy(s, 1)}
                    onSell={handleSell}
                    searchQuery={searchQuery}
                  />
                } />
                <Route path="/market" element={
                  <Market 
                    stocks={filteredStocks} 
                    watchlist={watchlist} 
                    onToggleWatchlist={toggleWatchlist}
                    onBuy={(s) => handleBuy(s, 1)}
                    onSell={handleSell}
                  />
                } />
                <Route path="/portfolio" element={
                  <Portfolio 
                    stocks={stocks} 
                    portfolio={portfolio} 
                    onSell={handleSell}
                  />
                } />
                <Route path="/orders" element={
                  <Orders transactions={transactions} />
                } />
                <Route path="/watchlist" element={
                  <Market 
                    stocks={filteredStocks.filter(s => watchlist.includes(s.symbol))} 
                    watchlist={watchlist} 
                    onToggleWatchlist={toggleWatchlist}
                    onBuy={(s) => handleBuy(s, 1)}
                    onSell={handleSell}
                  />
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}
