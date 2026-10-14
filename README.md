# 🚀 Vesto — Stock & Trading Management Platform

A production-ready stock trading simulation platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication** — Register, login, JWT-secured sessions, virtual wallet
- **Market Discovery** — Browse stocks, search symbols, view charts, top gainers/losers
- **Watchlist Management** — Create named watchlists, add/remove stocks, live tracking
- **Trading Engine** — Buy/sell market & limit orders with atomic balance validation
- **Portfolio Management** — Holdings overview, real-time P&L, asset allocation
- **Order History** — Active/pending orders, executed trade ledger, full statement view

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS   |
| Backend    | Node.js + Express.js             |
| Database   | MongoDB + Mongoose               |
| Auth       | JWT + bcryptjs                   |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Configure

```bash
cd vesto
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Seed the Database

```bash
cd backend
node seed.js
```

This populates 20+ stock symbols (AAPL, TSLA, MSFT, GOOGL, etc.) so Vesto is instantly testable.

### 4. Run the Application

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
vesto/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/       # JWT auth middleware
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── seed.js          # DB seed script
│   ├── server.js        # Entry point
│   └── .env.example     # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── context/     # Auth & Toast contexts
│   │   ├── services/    # API client layer
│   │   ├── App.jsx      # Root component & routing
│   │   └── main.jsx     # Entry point
│   └── index.html
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | `/api/auth/register`  | Register new user   |
| POST   | `/api/auth/login`     | Login user          |
| GET    | `/api/auth/me`        | Get current user    |

### Stocks
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/stocks`                 | List all stocks          |
| GET    | `/api/stocks/search?q=`       | Search stocks            |
| GET    | `/api/stocks/market/overview` | Market overview          |
| GET    | `/api/stocks/market/gainers`  | Top gainers              |
| GET    | `/api/stocks/market/losers`   | Top losers               |
| GET    | `/api/stocks/:symbol`         | Stock detail             |
| GET    | `/api/stocks/:symbol/chart`   | Historical chart data    |

### Watchlist
| Method | Endpoint                             | Description          |
|--------|--------------------------------------|----------------------|
| GET    | `/api/watchlist`                     | Get user watchlists  |
| POST   | `/api/watchlist`                     | Create watchlist     |
| POST   | `/api/watchlist/:id/add`             | Add stock            |
| DELETE | `/api/watchlist/:id/remove/:symbol`  | Remove stock         |
| DELETE | `/api/watchlist/:id`                 | Delete watchlist     |

### Orders
| Method | Endpoint                | Description         |
|--------|-------------------------|---------------------|
| POST   | `/api/orders/buy`       | Place buy order     |
| POST   | `/api/orders/sell`      | Place sell order    |
| GET    | `/api/orders`           | All user orders     |
| GET    | `/api/orders/active`    | Active/pending      |
| GET    | `/api/orders/history`   | Executed history    |
| DELETE | `/api/orders/:id`       | Cancel order        |

### Portfolio
| Method | Endpoint                   | Description         |
|--------|----------------------------|---------------------|
| GET    | `/api/portfolio`           | Holdings & P&L     |
| GET    | `/api/portfolio/summary`   | Asset allocation    |
| POST   | `/api/portfolio/deposit`   | Add funds           |
| POST   | `/api/portfolio/withdraw`  | Withdraw funds      |

## Trading Logic

**Buy Order:**
1. Validate `walletBalance >= quantity × currentPrice`
2. Deduct cost from wallet (atomic)
3. Update holding with weighted average price:
   `newAvgPrice = (currentQty × currentAvgPrice + newQty × buyPrice) / (currentQty + newQty)`

**Sell Order:**
1. Validate `holdingQuantity >= requestedQuantity`
2. Reduce holding quantity, remove if zero
3. Credit `quantity × sellPrice` to wallet

## License

MIT © Vesto
