# StockAI – Smart Market Platform

A full-stack educational stock trading simulator and portfolio management platform combining **real BSE market data**, virtual order execution, Firebase persistence, interactive charts, and Google Gemini-powered market insights.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/) [![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/) [![Google Gemini](https://img.shields.io/badge/Google%20Gemini-gemini--3.6--flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/) [![Alpha Vantage](https://img.shields.io/badge/Market%20Data-Alpha%20Vantage-0A85EA)](https://www.alphavantage.co/) [![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/) [![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)](https://render.com/)

**[GitHub Repository](https://github.com/rona346/stock-app)**

---

> ## Important Disclaimer
>
> **StockAI is an educational stock-trading simulator.**
>
> It does **not** execute real stock trades, connect to a brokerage or securities exchange, or handle real money. Account balances, holdings, BUY/SELL operations, and transaction records are virtual.
>
> AI-generated market insights are provided for educational and analytical purposes only and do not constitute financial advice or guaranteed predictions.

---

## Highlights

- **Real Market Data Integration** — Retrieves market data from the Alpha Vantage API for 10 supported BSE equities without using fabricated or randomized prices in the production market-data flow.
- **API Rate-Limit Protection** — Uses per-symbol runtime caching, persistent `stocks-cache.json` storage, a 24-hour cache TTL, sequential request pacing, a daily safety budget of 24 requests, request de-duplication through `stockRefreshPromise`, and cached real-data fallback.
- **Virtual Trading Engine** — Supports BUY and SELL operations with quantity validation, balance checks, holding checks, weighted-average price calculation, balance updates, and transaction recording.
- **Backend-Mediated Gemini AI** — Integrates Google Gemini through the Express backend using `@google/genai` and structured JSON responses while keeping the Gemini API key server-side.
- **Firebase Persistence** — Uses Firebase Authentication and Cloud Firestore for user-specific application state including portfolios, balances, watchlists, and transactions.
- **Separated Deployment Architecture** — React/Vite frontend deployed on Vercel communicates with the Node.js/Express backend deployed on Render.

---

### Architecture

| Component            | Technology                      | Role                                                                        |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| **Frontend**         | React 19 + TypeScript + Vite    | User interface, dashboards, charts, watchlist, portfolio, and trading       |
| **Backend**          | Node.js + Express + TypeScript  | REST API, market-data handling, caching, request pacing, and AI integration |
| **Market Data**      | Alpha Vantage                   | Provides market and historical data for supported BSE stocks                |
| **AI Layer**         | Google Gemini + `@google/genai` | Generates structured AI market insights                                     |
| **Authentication**   | Firebase Authentication         | Handles user authentication                                                 |
| **Database**         | Cloud Firestore                 | Stores user portfolio, watchlist, balance, and transaction data             |
| **Frontend Hosting** | Vercel                          | Hosts the React frontend                                                    |
| **Backend Hosting**  | Render                          | Hosts the Node.js/Express backend                                           |

---

## Tech Stack

### Frontend

- **React 19** — UI framework
- **TypeScript** — Type-safe application development
- **Vite** — Development server and production build tool
- **Tailwind CSS** — Styling
- **Recharts** — Data visualization
- **Motion** — UI animations and transitions
- **Lucide React** — Interface icons

### Backend

- **Node.js** — Server runtime
- **Express.js** — REST API framework
- **TypeScript** — Backend development
- **tsx** — TypeScript execution

### Cloud & Data

- **Firebase Authentication** — Authentication
- **Cloud Firestore** — Persistent application data
- **Alpha Vantage** — Market data
- **Google Gemini** — AI market insights

### Deployment & Source Control

- **Vercel** — Frontend deployment
- **Render** — Backend deployment
- **Git + GitHub** — Source control

---

## Real Market Data

StockAI's production market-data flow uses **real market data retrieved through Alpha Vantage**.

It does not use random or fabricated stock prices for the production market-data pipeline.

### Supported BSE Stocks

| Symbol          | Company                   |
| --------------- | ------------------------- |
| `RELIANCE.BSE`  | Reliance Industries       |
| `TCS.BSE`       | Tata Consultancy Services |
| `INFY.BSE`      | Infosys                   |
| `HDFCBANK.BSE`  | HDFC Bank                 |
| `ICICIBANK.BSE` | ICICI Bank                |
| `WIPRO.BSE`     | Wipro                     |
| `HCLTECH.BSE`   | HCL Technologies          |
| `ADANIENT.BSE`  | Adani Enterprises         |
| `SBIN.BSE`      | State Bank of India       |
| `ITC.BSE`       | ITC                       |

---

## Market Data & API Protection

Because Alpha Vantage has request limitations, the backend includes several mechanisms to reduce unnecessary external requests.

### Caching & Request Controls

1. **Per-Symbol Runtime Cache**
   Retrieved stock data is kept in memory to avoid unnecessary repeated API requests.

2. **Persistent Cache**
   Real retrieved market data is persisted in `stocks-cache.json`.

3. **24-Hour Cache TTL**
   Cached market data remains usable for a 24-hour period before refresh logic is required.

4. **Sequential Request Pacing**
   Alpha Vantage requests are serialized with approximately **12.5 seconds between sequential requests**.

5. **Daily Safety Budget**
   The application limits its Alpha Vantage usage to **24 requests per day**.

6. **Request De-Duplication**
   `stockRefreshPromise` prevents multiple concurrent refresh operations from triggering duplicate fetch loops.

7. **Cached Real-Data Fallback**
   If a fresh Alpha Vantage request fails or cannot be made, previously retrieved real data can be returned from the cache.

### Market Data Flow

```text
Frontend
   │
   ▼
GET /api/stocks
   │
   ▼
Express Backend
   │
   ├── Cached data available?
   │       │
   │       ├── Yes → Return cached data
   │       │
   │       └── No → Request Alpha Vantage
   │
   ▼
Alpha Vantage
   │
   ▼
Runtime / Persistent Cache
   │
   ▼
Frontend
```

---

## Virtual Trading Engine

StockAI includes a virtual trading system for practicing portfolio management.

All trading activity is simulated and does not interact with a brokerage or exchange.

### BUY Flow

```text
Validate Quantity
       ↓
Confirm Stock Price
       ↓
Calculate Order Value
       ↓
Check Virtual Balance
       ↓
Create / Update Holding
       ↓
Recalculate Weighted Average Price
       ↓
Deduct Virtual Balance
       ↓
Record Transaction
```

### SELL Flow

```text
Validate Quantity
       ↓
Confirm Holding Exists
       ↓
Check Available Holdings
       ↓
Calculate Order Value
       ↓
Update / Remove Holding
       ↓
Credit Virtual Balance
       ↓
Record Transaction
```

### Trading Validation

The application validates:

- Positive integer quantities
- Zero quantities
- Negative quantities
- Fractional quantities where whole shares are required
- Insufficient virtual balance during BUY operations
- Insufficient holdings during SELL operations

### Weighted Average Price

When additional shares are purchased, the holding's average purchase price is recalculated using:

```text
New Average Price =
(
    Existing Shares × Existing Average Price
    +
    New Shares × New Execution Price
)
/
(
    Existing Shares + New Shares
)
```

---

## Gemini AI Integration

StockAI integrates Google Gemini through the backend rather than exposing the API key to the browser.

### Request Flow

```text
React Frontend
      │
      │ POST /api/recommendation
      ▼
Node / Express Backend
      │
      │ @google/genai
      ▼
Google Gemini
      │
      │ Structured JSON
      ▼
Express Backend
      │
      ▼
React UI
```

### Model

The current Gemini model identifier used by the project is:

```text
gemini-3.6-flash
```

### Structured Recommendation

The backend uses structured JSON output containing fields such as:

```json
{
  "symbol": "INFY.BSE",
  "name": "Infosys Limited",
  "confidence": 84,
  "trend": "trend signal",
  "reason": "AI-generated analytical explanation."
}
```

The recommendation fields include:

- **symbol** — Ticker symbol of the evaluated stock
- **name** — Company name
- **confidence** — Confidence indicator generated for the analysis
- **trend** — Trend signal
- **reason** — Analytical explanation generated by the AI

> AI-generated insights are for educational and analytical exploration. They do not guarantee market performance or future price direction.

---

## Firebase Authentication & Firestore

Firebase provides authentication and persistent user-specific application data.

### Authentication

The application uses Firebase Authentication for user sign-up and sign-in.

### Firestore Data

Firestore is used for application state such as:

- Virtual account balance
- Portfolio holdings
- Watchlists
- BUY/SELL transaction history
- User-specific application data

### Portfolio Records

Portfolio holdings use deterministic document identifiers based on the authenticated user's UID and stock symbol where appropriate. This helps prevent duplicate holding documents for the same user and stock.

### Security Rules

Firestore security rules are used to restrict user data access and validate database operations according to the application's rules.

---

## Frontend Features

### Dashboard

Provides an overview of:

- Available virtual balance
- Portfolio value
- Returns
- Active holdings
- Gemini AI recommendation

### Market

Provides access to the supported BSE stocks and their retrieved market information.

### Interactive Charts

Historical stock data is visualized using Recharts.

### Portfolio

Displays holdings, average purchase price, current valuation, and portfolio performance information.

### Orders

Provides transaction/order history for virtual BUY and SELL activity.

### Watchlist

Allows users to keep track of selected supported stocks.

### Virtual Trading

Provides BUY and SELL interfaces with validation and portfolio updates.

### AI Recommendations

Displays Gemini-generated:

- Stock symbol
- Stock name
- Confidence
- Trend
- Analytical reasoning

---

## REST API

All backend API routes use the `/api` prefix.

### `GET /api/health`

Checks backend availability.

Example response:

```json
{
  "status": "ok"
}
```

### `GET /api/stocks`

Returns market data for the supported stocks.

### `GET /api/stocks/:symbol/history`

Returns historical price data for a supported stock.

Example:

```text
GET /api/stocks/RELIANCE.BSE/history
```

### `POST /api/recommendation`

Generates a Gemini AI recommendation based on supplied stock information.

Example request:

```json
{
  "symbol": "HDFCBANK.BSE",
  "price": 1650.25,
  "changePercent": 0.85
}
```

Example response structure:

```json
{
  "symbol": "HDFCBANK.BSE",
  "name": "HDFC Bank Limited",
  "confidence": 88,
  "trend": "trend signal",
  "reason": "AI-generated analytical explanation."
}
```

---

## Project Structure

```text
stockai---smart-market-platform/
│
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StockCard.tsx
│   │   └── StockChart.tsx
│   │
│   ├── lib/
│   │   └── firebase.ts
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Market.tsx
│   │   ├── Orders.tsx
│   │   └── Portfolio.tsx
│   │
│   ├── services/
│   │   ├── aiService.ts
│   │   └── stockService.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server.ts
├── firestore.rules
├── firebase-applet-config.json
├── firebase-blueprint.json
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── README.md
```

---

## Environment Variables

Sensitive configuration is managed through environment variables.

Example `.env.example` structure:

```env
# Backend-only API keys
GEMINI_API_KEY="your-gemini-api-key"
ALPHA_VANTAGE_API_KEY="your-alphavantage-api-key"

# Application configuration
PORT=3000
NODE_ENV="development"

# Firebase client configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Backend URL used by the frontend
VITE_API_BASE_URL="https://your-render-service.onrender.com"
```

### Security Practices

- Gemini API credentials remain server-side.
- Alpha Vantage credentials remain server-side.
- `.env` and `.env.local` files are excluded from Git.
- `stocks-cache.json` is excluded from Git.
- `dist/` is excluded from Git.
- Actual API keys must never be committed to the repository.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Alpha Vantage API key
- Google Gemini API key
- Firebase project with Authentication and Firestore configured

### 1. Clone the Repository

```bash
git clone https://github.com/rona346/stock-app.git
cd stock-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file using `.env.example` as the reference.

Configure your API keys and Firebase configuration.

> Never commit your local environment file or API credentials.

### 4. Start Development

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

### 6. Start the Application

```bash
npm run start
```

### 7. TypeScript Validation

```bash
npm run lint
```

The project's `lint` script currently runs TypeScript compilation/type checking.

---

## Deployment Architecture

StockAI uses separate frontend and backend deployments.

```text
┌─────────────────────────────┐
│      Vercel - Frontend      │
│                             │
│ React + Vite SPA            │
└──────────────┬──────────────┘
               │
               │ HTTPS API Requests
               ▼
┌─────────────────────────────┐
│      Render - Backend       │
│                             │
│ Node.js + Express           │
│                             │
│ • Alpha Vantage integration │
│ • Market-data caching       │
│ • Request pacing            │
│ • Gemini integration        │
└─────────────────────────────┘
```

The frontend communicates with the Render backend for server-side market-data and Gemini operations.

Firebase Authentication and Firestore provide the application's authentication and persistent user data layer.

---

## Production Verification

The project has undergone production-flow verification across the main application features.

### Verified

- [x] Real Alpha Vantage market data
- [x] All 10 supported BSE stocks
- [x] Dashboard flow
- [x] Market flow
- [x] Search/filter functionality
- [x] Watchlist operations
- [x] Portfolio management
- [x] Virtual BUY flow
- [x] Virtual SELL flow
- [x] Order/transaction history
- [x] Gemini AI recommendation flow
- [x] Firebase Authentication
- [x] Firestore persistence
- [x] Backend API
- [x] Vercel frontend deployment
- [x] Render backend deployment

### Development Verification

```text
npm run lint
PASS

npm run build
PASS
```

The production build was successfully generated using Vite.

---

## Reliability & Security Considerations

StockAI includes several safeguards relevant to its architecture:

- Backend-only Gemini API integration
- Backend-only Alpha Vantage API integration
- Environment-based secret management
- Firestore security rules
- User-specific application data
- Input validation for virtual trading
- Alpha Vantage request pacing
- Daily API request protection
- Runtime and persistent market-data caching
- Cached real-data fallback
- Request de-duplication

---

## Repository

**GitHub:**
https://github.com/rona346/stock-app

The project is maintained on the `main` branch.

The unused `yahoo-finance2` dependency has been removed from the current project. Market data is handled through the Alpha Vantage integration.

---

## Future Improvements

Potential future enhancements include:

- Advanced virtual order types such as limit and stop-loss orders
- Technical indicators such as SMA, EMA, RSI, MACD, and Bollinger Bands
- More detailed portfolio analytics
- Historical portfolio equity curves
- Drawdown analysis
- AI-powered news and sentiment analysis
- Portfolio and transaction export
- Additional supported stocks and markets
- More advanced caching strategies

---

## License

StockAI is an educational and portfolio demonstration project.

See the repository for the applicable license information.

---

## Disclaimer

StockAI is intended for **education, experimentation, and portfolio demonstration**.

It does not:

- Execute real stock-market trades
- Connect to a brokerage account
- Handle real money
- Guarantee investment returns
- Provide guaranteed financial predictions

AI-generated market insights should not be treated as financial advice.
