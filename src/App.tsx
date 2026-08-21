import React, { useState, useEffect,  useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, Timestamp, signOut, signInWithPopup, googleProvider, onSnapshot, query, collection, where, addDoc, deleteDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from './lib/firebase';
import { UserProfile, StockData, WatchlistItem, PortfolioItem, Transaction, AIRecommendation } from './types';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { generateInitialStockData } from './services/stockService';
import { getAIRecommendation } from './services/aiService';
import { motion, AnimatePresence } from 'motion/react';

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [stocks, setStocks] = useState<StockData[]>([]);
  const latestStocksRef = useRef<StockData[]>([]);
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
  useEffect(() => {
    latestStocksRef.current = stocks;
  }, [stocks]);

  // AI Recommendation Trigger
    useEffect(() => {
      if (!user || stocks.length === 0) return;

      const fetchAI = async () => {
        const currentStocks = latestStocksRef.current;

        if (currentStocks.length === 0) return;

        setLoadingAI(true);

        try {
          const rec = await getAIRecommendation(currentStocks);
          setRecommendation(rec);
        } catch (error) {
          console.error("AI Recommendation Error:", error);
        } finally {
          setLoadingAI(false);
        }
      };

      fetchAI();

      const aiInterval = setInterval(fetchAI, 60000);

      return () => clearInterval(aiInterval);
    }, [user, stocks.length]);

    const refreshAIRecommendation = async () => {
    const currentStocks = latestStocksRef.current;

    if (currentStocks.length === 0) return;

    setLoadingAI(true);

    try {
      const rec = await getAIRecommendation(currentStocks);
      setRecommendation(rec);
    } catch (error) {
      console.error("Manual AI Refresh Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };
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
                    onRefreshAI={refreshAIRecommendation}
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
