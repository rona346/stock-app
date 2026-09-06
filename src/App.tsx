import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  onAuthStateChanged,
  auth,
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  signOut,
  signInWithPopup,
  googleProvider,
  onSnapshot,
  query,
  collection,
  where,
  addDoc,
  deleteDoc,
  runTransaction,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "./lib/firebase";
import {
  UserProfile,
  StockData,
  WatchlistItem,
  PortfolioItem,
  Transaction,
  AIRecommendation,
} from "./types";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Portfolio from "./pages/Portfolio";
import Orders from "./pages/Orders";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { AuthForm } from "./components/AuthForm";
import { getAIRecommendation } from "./services/aiService";
import { motion, AnimatePresence } from "motion/react";

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("stockai-theme");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;

    return false; // First visit = Light mode
  });

  const [stocks, setStocks] = useState<StockData[]>([]);
  const latestStocksRef = useRef<StockData[]>([]);
  useEffect(() => {
    latestStocksRef.current = stocks;
  }, [stocks]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(
    null,
  );
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);
  const activeTradesRef = useRef<Set<string>>(new Set());
  const getCanonicalPortfolioId = (uid: string, symbol: string) =>
    `${uid}_${symbol}`;
  const isValidTradeQuantity = (quantity: number) =>
    Number.isInteger(quantity) && quantity > 0;

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem("stockai-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (
            firebaseUser.photoURL &&
            userData.photoURL !== firebaseUser.photoURL
          ) {
            const updatedUser = {
              ...userData,
              photoURL: firebaseUser.photoURL,
            };
            await setDoc(
              doc(db, "users", firebaseUser.uid),
              { photoURL: firebaseUser.photoURL },
              { merge: true },
            );
            setUser(updatedUser);
          } else {
            setUser(userData);
          }
        } else {
          // Create user doc if it doesn't exist (for Google Sign-In)
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            balance: 100000,
            createdAt: Timestamp.now(),
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
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

    const unsubWatchlist = onSnapshot(
      doc(db, "watchlists", user.uid),
      (doc) => {
        if (doc.exists()) {
          setWatchlist(doc.data().symbols || []);
        }
      },
    );

    const unsubPortfolio = onSnapshot(
      query(collection(db, "portfolios"), where("uid", "==", user.uid)),
      (snapshot) => {
        const items: PortfolioItem[] = [];
        snapshot.forEach((doc) =>
          items.push({ id: doc.id, ...doc.data() } as PortfolioItem),
        );
        setPortfolio(items);
      },
    );

    const unsubTransactions = onSnapshot(
      query(collection(db, "transactions"), where("uid", "==", user.uid)),
      (snapshot) => {
        const items: Transaction[] = [];
        snapshot.forEach((doc) =>
          items.push({ id: doc.id, ...doc.data() } as Transaction),
        );
        // Sort by timestamp descending
        items.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        setTransactions(items);
      },
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
        const response = await fetch(`${process.env.BACKEND_URL}/api/stocks`);

        if (!response.ok) {
          throw new Error("Failed to fetch stocks");
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setStocks(data);
        } else {
          console.warn("Stock API returned no real market data.");
        }
      } catch (error) {
        console.error("Stock Fetch Error:", error);
      }
    };

    fetchStocks();
  }, []);

  // AI Recommendation Trigger
  useEffect(() => {
    if (!user || stocks.length === 0) return;

    const fetchAI = async () => {
      const currentStocks = latestStocksRef.current;

      if (currentStocks.length === 0) return;

      setLoadingAI(true);

      try {
        setAiError(null);

        const rec = await getAIRecommendation(currentStocks);
        setRecommendation(rec);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to generate AI recommendation.";

        console.error("AI Recommendation Error:", error);
        setAiError(message);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAI();
  }, [user, stocks.length]);

  const refreshAIRecommendation = async () => {
    console.log("Refresh AI button clicked");
    console.log("Current stocks:", latestStocksRef.current);
    const currentStocks = latestStocksRef.current;

    if (currentStocks.length === 0) return;

    setLoadingAI(true);

    try {
      setAiError(null);

      const rec = await getAIRecommendation(currentStocks);
      setRecommendation(rec);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to refresh AI recommendation.";

      console.error("Manual AI Refresh Error:", error);
      setAiError(message);
    } finally {
      setLoadingAI(false);
    }
  };
  // Handlers
  const handleAuth = async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    try {
      if (authType === "signup") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          pass,
        );
        const firebaseUser = userCredential.user;

        if (name) {
          await updateProfile(firebaseUser, { displayName: name });
        }

        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          displayName: name || firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          balance: 100000,
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
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

  const resetAccount = async () => {
    if (!user) return;

    try {
      // 1. Reset user balance
      await setDoc(
        doc(db, "users", user.uid),
        { balance: 100000 },
        { merge: true },
      );

      // 2. Get and delete user's portfolio documents
      const portfolioQuery = query(
        collection(db, "portfolios"),
        where("uid", "==", user.uid),
      );

      const portfolioSnapshot = await getDocs(portfolioQuery);

      await Promise.all(
        portfolioSnapshot.docs.map((item) =>
          deleteDoc(doc(db, "portfolios", item.id)),
        ),
      );

      // 3. Get and delete user's transaction documents
      const transactionQuery = query(
        collection(db, "transactions"),
        where("uid", "==", user.uid),
      );

      const transactionSnapshot = await getDocs(transactionQuery);

      await Promise.all(
        transactionSnapshot.docs.map((item) =>
          deleteDoc(doc(db, "transactions", item.id)),
        ),
      );

      // 4. Reset React state
      setUser((prev) => (prev ? { ...prev, balance: 100000 } : null));

      setPortfolio([]);
      setTransactions([]);

      setNotifications((prev) => ["Account reset successfully.", ...prev]);

      console.log("Account reset successfully");
    } catch (error) {
      console.error("Account reset failed:", error);
      alert("Failed to reset account. Check the console.");
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    if (!user) return;
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];

    await setDoc(doc(db, "watchlists", user.uid), {
      uid: user.uid,
      symbols: newWatchlist,
    });
  };

  const handleBuy = async (stock: StockData, amount: number = 1) => {
    if (!user) return;

    if (!isValidTradeQuantity(amount)) {
      alert("Quantity must be a whole number greater than 0.");
      return;
    }

    const tradeKey = `BUY:${stock.symbol}`;

    if (activeTradesRef.current.has(tradeKey)) {
      alert("A buy transaction is already in progress.");
      return;
    }

    activeTradesRef.current.add(tradeKey);

    const userRef = doc(db, "users", user.uid);
    const portfolioId = getCanonicalPortfolioId(user.uid, stock.symbol);
    const portfolioRef = doc(db, "portfolios", portfolioId);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read latest user data
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error("User account not found.");
        }

        const userData = userSnapshot.data() as UserProfile;
        const totalCost = stock.price * amount;

        // 2. Validate latest balance
        if (userData.balance < totalCost) {
          throw new Error("Insufficient balance!");
        }

        // 3. Read canonical portfolio document
        const portfolioSnapshot = await transaction.get(portfolioRef);

        let currentQuantity = 0;
        let currentInvestedValue = 0;

        if (portfolioSnapshot.exists()) {
          const portfolioData = portfolioSnapshot.data();

          currentQuantity = Number(portfolioData.quantity ?? 0);
          const averagePrice = Number(portfolioData.averagePrice ?? 0);

          currentInvestedValue = currentQuantity * averagePrice;
        }

        const newQuantity = currentQuantity + amount;
        const newInvestedValue = currentInvestedValue + totalCost;

        const newAveragePrice =
          newQuantity > 0 ? newInvestedValue / newQuantity : stock.price;

        // 4. Update balance
        transaction.set(
          userRef,
          {
            balance: userData.balance - totalCost,
          },
          { merge: true },
        );

        // 5. Update/create canonical portfolio holding
        transaction.set(
          portfolioRef,
          {
            uid: user.uid,
            symbol: stock.symbol,
            quantity: newQuantity,
            averagePrice: newAveragePrice,
            lastUpdated: Timestamp.now(),
          },
          { merge: true },
        );

        // 6. Record BUY transaction
        const buyTxRef = doc(collection(db, "transactions"));

        transaction.set(buyTxRef, {
          uid: user.uid,
          symbol: stock.symbol,
          type: "BUY",
          quantity: amount,
          price: stock.price,
          timestamp: Timestamp.now(),
        });
      });

      // 7. Update React state only after success
      setUser((prev) =>
        prev
          ? {
              ...prev,
              balance: prev.balance - stock.price * amount,
            }
          : null,
      );

      setNotifications((prev) => [
        `Successfully purchased ${amount} shares of ${stock.symbol} at ₹${stock.price.toFixed(2)}`,
        ...prev,
      ]);
    } catch (error) {
      console.error("Buy transaction failed:", error);

      const message =
        error instanceof Error ? error.message : "Failed to complete purchase.";

      alert(message);
    } finally {
      activeTradesRef.current.delete(tradeKey);
    }
  };
  const handleSell = async (stock: StockData, amount?: number) => {
    if (!user) return;

    // Validate provided quantity
    if (amount !== undefined && !isValidTradeQuantity(amount)) {
      alert("Quantity must be a whole number greater than 0.");
      return;
    }

    const tradeKey = `SELL:${stock.symbol}`;

    if (activeTradesRef.current.has(tradeKey)) {
      alert("A sell transaction is already in progress.");
      return;
    }

    activeTradesRef.current.add(tradeKey);

    const userRef = doc(db, "users", user.uid);

    const portfolioId = getCanonicalPortfolioId(user.uid, stock.symbol);

    const portfolioRef = doc(db, "portfolios", portfolioId);

    try {
      let soldQuantity = 0;
      let newBalance = 0;

      await runTransaction(db, async (transaction) => {
        // 1. Read latest user data
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error("User account not found.");
        }

        const userData = userSnapshot.data() as UserProfile;

        // 2. Read latest portfolio data
        const portfolioSnapshot = await transaction.get(portfolioRef);

        if (!portfolioSnapshot.exists()) {
          throw new Error("No shares available to sell.");
        }

        const portfolioData = portfolioSnapshot.data();

        const currentQuantity = Number(portfolioData.quantity ?? 0);

        if (!Number.isInteger(currentQuantity) || currentQuantity <= 0) {
          throw new Error("No shares available to sell.");
        }

        // 3. If amount is undefined => Sell All
        const quantityToSell = amount === undefined ? currentQuantity : amount;

        // 4. Never allow selling more than owned
        if (quantityToSell > currentQuantity) {
          throw new Error(
            `Insufficient holdings! You only own ${currentQuantity} shares of ${stock.symbol}.`,
          );
        }

        if (!isValidTradeQuantity(quantityToSell)) {
          throw new Error("Quantity must be a whole number greater than 0.");
        }

        soldQuantity = quantityToSell;

        const totalGain = stock.price * quantityToSell;

        newBalance = userData.balance + totalGain;

        const remainingQuantity = currentQuantity - quantityToSell;

        // 5. Update user balance
        transaction.set(
          userRef,
          {
            balance: newBalance,
          },
          { merge: true },
        );

        // 6. Update or delete portfolio
        if (remainingQuantity > 0) {
          transaction.set(
            portfolioRef,
            {
              uid: user.uid,
              symbol: stock.symbol,
              quantity: remainingQuantity,
              averagePrice: Number(portfolioData.averagePrice ?? stock.price),
              lastUpdated: Timestamp.now(),
            },
            { merge: true },
          );
        } else {
          // Sell All
          transaction.delete(portfolioRef);
        }

        // 7. Record SELL transaction
        const sellTxRef = doc(collection(db, "transactions"));

        transaction.set(sellTxRef, {
          uid: user.uid,
          symbol: stock.symbol,
          type: "SELL",
          quantity: quantityToSell,
          price: stock.price,
          timestamp: Timestamp.now(),
        });
      });

      // 8. Update local React state only after success
      setUser((prev) =>
        prev
          ? {
              ...prev,
              balance: newBalance,
            }
          : null,
      );

      setNotifications((prev) => [
        `Successfully sold ${soldQuantity} shares of ${stock.symbol} at ₹${stock.price.toFixed(2)}`,
        ...prev,
      ]);
    } catch (error) {
      console.error("Sell transaction failed:", error);

      const message =
        error instanceof Error ? error.message : "Failed to complete sale.";

      alert(message);
    } finally {
      activeTradesRef.current.delete(tradeKey);
    }
  };
  const handleAutoInvest = async () => {
    if (!user || !recommendation) return;
    const stock = stocks.find((s) => s.symbol === recommendation.symbol);
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

  const filteredStocks = (stocks || []).filter((stock) => {
    if (!stock) return false;
    const symbol = String(stock.symbol || "").toLowerCase();
    const name = String(stock.name || "").toLowerCase();
    const query = String(searchQuery || "").toLowerCase();
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
          setAuthType((prev) => (prev === "login" ? "signup" : "login"));
        }}
        error={authError}
      />
    );
  }

  return (
    <Router>
      <div
        className={`flex min-h-screen ${isDarkMode ? "dark bg-gray-950" : "bg-gray-50"}`}
      >
        <Sidebar onLogout={handleLogout} onResetAccount={resetAccount} />

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
                <Route
                  path="/"
                  element={
                    <Dashboard
                      user={user}
                      stocks={filteredStocks}
                      allStocks={stocks}
                      portfolio={portfolio}
                      recommendation={recommendation}
                      onAutoInvest={handleAutoInvest}
                      onRefreshAI={refreshAIRecommendation}
                      loadingAI={loadingAI}
                      aiError={aiError}
                      watchlist={watchlist}
                      onToggleWatchlist={toggleWatchlist}
                      onBuy={(s, quantity) => {
                        void handleBuy(s, quantity);
                      }}
                      onSell={(s, quantity) => {
                        void handleSell(s, quantity);
                      }}
                      searchQuery={searchQuery}
                    />
                  }
                />
                <Route
                  path="/market"
                  element={
                    <Market
                      stocks={filteredStocks}
                      watchlist={watchlist}
                      onToggleWatchlist={toggleWatchlist}
                      onBuy={(s, quantity) => {
                        void handleBuy(s, quantity);
                      }}
                      onSell={(s, quantity) => {
                        void handleSell(s, quantity);
                      }}
                    />
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <Portfolio
                      stocks={stocks}
                      portfolio={portfolio}
                      onSell={handleSell}
                    />
                  }
                />
                <Route
                  path="/orders"
                  element={<Orders transactions={transactions} />}
                />
                <Route
                  path="/watchlist"
                  element={
                    <Market
                      stocks={filteredStocks.filter((s) =>
                        watchlist.includes(s.symbol),
                      )}
                      watchlist={watchlist}
                      onToggleWatchlist={toggleWatchlist}
                      onBuy={(s) => handleBuy(s, 1)}
                      onSell={handleSell}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}
