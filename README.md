# StockAI – Smart Market Platform

A modern full-stack stock trading simulator and portfolio management web application built with **React**, **TypeScript**, **Node.js / Express**, **Firebase / Firestore**, and the **Google Gemini API**.

---

## 1. Project Overview

**StockAI – Smart Market Platform** is an interactive, full-stack stock trading simulator designed to give users a risk-free environment to practice equities trading, manage virtual portfolios, monitor simulated market dynamics, and receive AI-generated market insights.

> **Disclaimer:** This application is strictly a **stock trading simulator** built for educational, analytical, and demonstration purposes. It does not connect to live stock exchanges, execute real-world financial transactions, or handle real fiat currency. All market movements, balances, orders, and portfolio values are virtual.

---

## 2. Features

### Market Simulation & Dynamic Data

- **Simulated Market Engine:** Generates periodic price ticks, simulated price changes, and historical price sequences for a diverse basket of equities.
- **Real-Time Price & Change Display:** Displays current asset prices, percentage changes, and directional trend indicators.
- **Interactive Stock Charts:** Visualizes stock price trends across timeframes using dynamic area and line charts powered by Recharts.

### Trading & Order Execution

- **Buy & Sell Order Execution:** Fast and intuitive buy and sell operations with immediate balance and holding recalculation.
- **Comprehensive Validation Guards:** Multi-layered input and balance verification preventing invalid, negative, fractional, or over-budget orders.
- **Transaction History / Order Log:** Complete record of all buy/sell transactions with timestamps, stock symbols, execution prices, quantities, and net totals.

### Portfolio & Watchlist Management

- **Portfolio Overview:** Real-time tracking of total portfolio value, cash balance, invested capital, and overall return.
- **Holdings Breakdown:** Detailed breakdown of owned shares, average buy price, current market value, and unrealized profit/loss per asset.
- **Custom Watchlist:** Quick-pinning and monitoring of favorite tickers for rapid market access.

### AI-Driven Market Insights

- **Gemini AI Stock Recommendations:** Server-side integration with Google's Gemini model to analyze simulated market conditions and generate contextual summaries, trend analyses, and trading insights.

### Security & User Experience

- **Firebase Authentication & Firestore Sync:** Secure user session management and cloud persistence for persistent balances, holdings, watchlists, and orders.
- **Responsive & Accessible UI:** Clean, modern interface styled with Tailwind CSS, animated with Motion, and adorned with Lucide React iconography.

---

## 3. Tech Stack

| Domain                  | Technology                          | Purpose                                                                       |
| :---------------------- | :---------------------------------- | :---------------------------------------------------------------------------- |
| **Frontend Framework**  | React 19, TypeScript                | Reactive component-based user interface and strong type safety                |
| **Styling & Icons**     | Tailwind CSS, Lucide React          | Modern utility-first CSS design and consistent icon language                  |
| **Animations**          | Motion (`motion/react`)             | Fluid UI transitions, micro-interactions, and modal animations                |
| **Data Visualization**  | Recharts                            | Interactive, responsive financial area and candlestick charts                 |
| **Build Tool**          | Vite                                | Ultra-fast development server and optimized production bundling               |
| **Backend Runtime**     | Node.js, Express.js                 | REST API server handling simulated market logic and AI proxy routes           |
| **Authentication & DB** | Firebase Auth, Cloud Firestore      | Cloud user authentication, user state synchronization, and persistent storage |
| **AI Integration**      | Google Gemini API (`@google/genai`) | Server-side intelligent stock analysis and recommendations                    |
| **Version Control**     | Git & GitHub                        | Source code management and repository hosting                                 |

---

## 4. Application Modules

```
StockAI/
├── Market Explorer         # View simulated market tickers, prices, and daily movements
├── Interactive Charting    # Dynamic price trend visualization across selected assets
├── Trading Terminal        # Buy/Sell order entry panel with instant validation feedback
├── Portfolio Dashboard     # Total equity, available balance, and asset distribution
├── Holdings Table          # Active positions with real-time valuation and P/L metrics
├── Order History           # Audit trail of all historical buy and sell transactions
├── Watchlist Manager       # Pinned stock monitor for rapid access
└── AI Market Advisor       # Gemini-powered recommendations and market commentary
```

---

## 5. Trading & Validation Engine

To maintain market simulation integrity, all order submissions pass through strict client and server validation checks:

- **Quantity Validation:** Ensures only valid positive integers are entered.
- **Zero & Negative Value Rejection:** Prevents accidental or invalid submissions of `0` or negative quantities.
- **Fractional Share Validation:** Disallows non-integer fractional quantities where whole shares are required.
- **Insufficient Balance Protection (BUY):** Rejects buy orders when `(Quantity * Current Price) > Available Cash Balance`.
- **Insufficient Holdings Protection (SELL):** Rejects sell orders when attempting to sell more shares than currently owned.
- **Atomic Balance & Position Updates:** Updates cash balance and share positions synchronously upon validated execution.

---

## 6. AI Integration

StockAI integrates the **Google Gemini API** through a secure server-side architecture to provide automated stock analysis based on simulated market data:

1. **Server-Side Proxy:** Client requests trigger backend endpoints in `server.ts`, keeping API credentials safe from browser exposure.
2. **Contextual Market Prompts:** The backend formats current simulated ticker movements, volatility patterns, and historical price actions into structured prompts.
3. **Structured Insights:** Gemini generates concise, actionable recommendations (e.g., technical momentum observations, risk considerations, and summary outlooks) that are rendered directly in the UI.

---

## 7. Backend & API Architecture

The backend is built with **Node.js** and **Express.js** (`server.ts`), providing modular REST API endpoints for market simulation and AI processing:

- `GET /api/health` — Service health check and uptime verification.
- `GET /api/stocks` — Retrieves current simulated stock prices, variations, and catalog data.
- `GET /api/stocks/:symbol/history` — Returns historical price points for charting.
- `POST /api/recommendations` — Proxies market data to the Gemini API to produce AI recommendations.

---

## 8. Firebase & Cloud Firestore

Persistent user data is securely managed through Firebase services:

- **Firebase Authentication:** Handles user registration, login, and secure session tokens.
- **Cloud Firestore Collections:**
  - `users/{uid}` — Stores user profile information, initial virtual balance, and metadata.
  - `portfolios/{uid}` — Stores current cash balance, active stock holdings, and aggregate cost basis.
  - `orders/{uid}/transactions` — Historical log of all executed buy/sell orders.
  - `watchlists/{uid}` — User-specific list of pinned stock symbols.

---

## 9. Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- A Firebase project (with Authentication and Firestore enabled)
- A Google Gemini API Key

### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/rona346/stockai-market-platform.git
   cd stockai-market-platform
   ```

2. **Install project dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the project root by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

---

## 10. Environment Variables

Create a `.env.local` (or `.env`) file in the root directory and define the following variables:

```env
# Gemini API Key (Required for server-side AI recommendations)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Optional: Application hosting URL (if needed for deployment callbacks)
APP_URL="http://localhost:3000"

# Firebase Client Configuration (if configured via environment variables)
# VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
# VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
# VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
# VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
# VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
# VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
```

> **Security Note:** Never commit `.env`, `.env.local`, or any actual API keys to GitHub. Ensure `.env*` entries are included in your `.gitignore` file.

---

## 11. Running Locally

Start the development server (runs both the Express backend and Vite frontend):

```bash
npm run dev
```

Once started, navigate to:

```
http://localhost:3000
```

---

## 12. Build & Production Deployment

To create an optimized production build:

```bash
# Compile client assets and server bundle
npm run build

# Start the compiled production server
npm run start
```

- **Frontend Assets:** Bundled into the `dist/` directory via Vite.
- **Backend Bundle:** Compiled into `dist/server.cjs` via `esbuild`.

---

## 13. Project Status

- **Status:** Completed Core Architecture & Feature Set
- **Simulation Engine:** Operational with real-time price updates and interactive charts.
- **Trading & Validation:** Fully implemented with multi-condition validation guards.
- **AI Recommendation Module:** Integrated with Google Gemini API via backend proxy.
- **Cloud Persistence:** Firebase Auth and Firestore integration ready for multi-user session state.

---

## 14. Future Improvements

- [ ] **Advanced Order Types:** Implementation of simulated limit orders, stop-loss orders, and take-profit triggers.
- [ ] **Technical Indicators:** Addition of moving averages (SMA/EMA), RSI, MACD, and Bollinger Bands on charts.
- [ ] **Portfolio Performance Analytics:** Historical equity curves, Sharpe ratio estimation, and maximum drawdown calculations.
- [ ] **Simulated News Feed:** Ingestion of simulated market news with AI-powered sentiment analysis per stock.
- [ ] **Export Capabilities:** Exporting portfolio reports and transaction histories to CSV and PDF formats.

---

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
