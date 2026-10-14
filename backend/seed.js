const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('./models/Stock');

dotenv.config();

const stocksData = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    currentPrice: 178.72,
    previousClose: 175.45,
    high52Week: 199.62,
    low52Week: 147.61,
    marketCap: 2780000000000,
    volume: 58240000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla, Inc.',
    currentPrice: 245.80,
    previousClose: 251.20,
    high52Week: 299.29,
    low52Week: 152.37,
    marketCap: 780000000000,
    volume: 112450000,
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    currentPrice: 370.45,
    previousClose: 367.10,
    high52Week: 384.30,
    low52Week: 220.00,
    marketCap: 2750000000000,
    volume: 24500000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    currentPrice: 140.25,
    previousClose: 138.90,
    high52Week: 142.38,
    low52Week: 88.58,
    marketCap: 1760000000000,
    volume: 28400000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    currentPrice: 145.18,
    previousClose: 146.50,
    high52Week: 149.26,
    low52Week: 81.43,
    marketCap: 1510000000000,
    volume: 48900000,
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms, Inc.',
    currentPrice: 334.22,
    previousClose: 328.65,
    high52Week: 342.92,
    low52Week: 112.50,
    marketCap: 860000000000,
    volume: 18700000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currentPrice: 481.60,
    previousClose: 469.50,
    high52Week: 505.48,
    low52Week: 140.34,
    marketCap: 1190000000000,
    volume: 42300000,
    sector: 'Technology',
    industry: 'Semiconductors',
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    currentPrice: 155.30,
    previousClose: 156.80,
    high52Week: 159.38,
    low52Week: 123.11,
    marketCap: 450000000000,
    volume: 10400000,
    sector: 'Financial Services',
    industry: 'Banks - Diversified',
  },
  {
    symbol: 'V',
    companyName: 'Visa Inc.',
    currentPrice: 260.15,
    previousClose: 258.40,
    high52Week: 263.25,
    low52Week: 200.58,
    marketCap: 535000000000,
    volume: 6200000,
    sector: 'Financial Services',
    industry: 'Credit Services',
  },
  {
    symbol: 'JNJ',
    companyName: 'Johnson & Johnson',
    currentPrice: 155.85,
    previousClose: 157.10,
    high52Week: 175.97,
    low52Week: 144.95,
    marketCap: 375000000000,
    volume: 7800000,
    sector: 'Healthcare',
    industry: 'Drug Manufacturers - General',
  },
  {
    symbol: 'WMT',
    companyName: 'Walmart Inc.',
    currentPrice: 165.40,
    previousClose: 164.20,
    high52Week: 169.94,
    low52Week: 136.09,
    marketCap: 445000000000,
    volume: 6900000,
    sector: 'Consumer Defensive',
    industry: 'Discount Stores',
  },
  {
    symbol: 'PG',
    companyName: 'The Procter & Gamble Company',
    currentPrice: 152.10,
    previousClose: 153.25,
    high52Week: 158.38,
    low52Week: 136.65,
    marketCap: 358000000000,
    volume: 5400000,
    sector: 'Consumer Defensive',
    industry: 'Household & Personal Products',
  },
  {
    symbol: 'UNH',
    companyName: 'UnitedHealth Group Incorporated',
    currentPrice: 542.90,
    previousClose: 539.10,
    high52Week: 558.10,
    low52Week: 445.68,
    marketCap: 501000000000,
    volume: 3100000,
    sector: 'Healthcare',
    industry: 'Healthcare Plans',
  },
  {
    symbol: 'HD',
    companyName: 'The Home Depot, Inc.',
    currentPrice: 310.25,
    previousClose: 314.50,
    high52Week: 347.06,
    low52Week: 274.26,
    marketCap: 308000000000,
    volume: 4300000,
    sector: 'Consumer Cyclical',
    industry: 'Home Improvement Retail',
  },
  {
    symbol: 'MA',
    companyName: 'Mastercard Incorporated',
    currentPrice: 405.60,
    previousClose: 401.90,
    high52Week: 418.60,
    low52Week: 338.56,
    marketCap: 380000000000,
    volume: 2900000,
    sector: 'Financial Services',
    industry: 'Credit Services',
  },
  {
    symbol: 'DIS',
    companyName: 'The Walt Disney Company',
    currentPrice: 88.40,
    previousClose: 90.15,
    high52Week: 118.18,
    low52Week: 78.73,
    marketCap: 161000000000,
    volume: 12500000,
    sector: 'Communication Services',
    industry: 'Entertainment',
  },
  {
    symbol: 'NFLX',
    companyName: 'Netflix, Inc.',
    currentPrice: 452.30,
    previousClose: 446.80,
    high52Week: 485.00,
    low52Week: 275.50,
    marketCap: 199000000000,
    volume: 5100000,
    sector: 'Communication Services',
    industry: 'Entertainment',
  },
  {
    symbol: 'PYPL',
    companyName: 'PayPal Holdings, Inc.',
    currentPrice: 62.15,
    previousClose: 63.80,
    high52Week: 88.63,
    low52Week: 50.25,
    marketCap: 67000000000,
    volume: 14200000,
    sector: 'Financial Services',
    industry: 'Credit Services',
  },
  {
    symbol: 'INTC',
    companyName: 'Intel Corporation',
    currentPrice: 38.65,
    previousClose: 39.40,
    high52Week: 45.34,
    low52Week: 24.73,
    marketCap: 162000000000,
    volume: 38900000,
    sector: 'Technology',
    industry: 'Semiconductors',
  },
  {
    symbol: 'AMD',
    companyName: 'Advanced Micro Devices, Inc.',
    currentPrice: 108.90,
    previousClose: 105.75,
    high52Week: 132.83,
    low52Week: 60.05,
    marketCap: 176000000000,
    volume: 55400000,
    sector: 'Technology',
    industry: 'Semiconductors',
  },
];

const seedDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vesto';

  try {
    console.log(`[Seed] Connecting to MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[Seed] Connected successfully.');

    // Clear existing stocks
    console.log('[Seed] Clearing existing stock records...');
    await Stock.deleteMany({});

    // Calculate changePercent for each stock before inserting
    const stocksWithCalculatedFields = stocksData.map((item) => {
      const change = item.currentPrice - item.previousClose;
      const changePercent = Number(((change / item.previousClose) * 100).toFixed(2));
      return {
        ...item,
        changePercent,
        updatedAt: new Date(),
      };
    });

    console.log(`[Seed] Inserting ${stocksWithCalculatedFields.length} stocks...`);
    const inserted = await Stock.insertMany(stocksWithCalculatedFields);
    console.log(`[Seed] Successfully inserted ${inserted.length} stocks into database:`);
    inserted.forEach((s) => {
      const sign = s.changePercent >= 0 ? '+' : '';
      console.log(`  - ${s.symbol.padEnd(6)} | $${s.currentPrice.toFixed(2).padStart(7)} | ${sign}${s.changePercent}% | ${s.companyName}`);
    });

    console.log('[Seed] Database seed completed successfully.');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
};

seedDB();
