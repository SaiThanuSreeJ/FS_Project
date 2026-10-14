const Stock = require('../models/Stock');

// @desc    Get all stocks with optional sector filter
// @route   GET /api/stocks
// @access  Public
exports.getAllStocks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.sector) {
      filter.sector = new RegExp(`^${req.query.sector.trim()}$`, 'i');
    }

    const stocks = await Stock.find(filter).sort({ symbol: 1 });

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search stocks by symbol or company name
// @route   GET /api/stocks/search
// @access  Public
exports.searchStocks = async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === '') {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const regex = new RegExp(query.trim(), 'i');
    const stocks = await Stock.find({
      $or: [{ symbol: regex }, { companyName: regex }],
    })
      .sort({ symbol: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get market overview summary
// @route   GET /api/stocks/market/overview
// @access  Public
exports.getMarketOverview = async (req, res, next) => {
  try {
    const stocks = await Stock.find({});
    const totalStocks = stocks.length;

    if (totalStocks === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStocks: 0,
          averageChangePercent: 0,
          advancingStocks: 0,
          decliningStocks: 0,
          marketDirection: 'Neutral',
        },
      });
    }

    let totalChangePercent = 0;
    let advancingStocks = 0;
    let decliningStocks = 0;

    stocks.forEach((s) => {
      const changePct = s.changePercent || 0;
      totalChangePercent += changePct;
      if (changePct > 0) advancingStocks++;
      else if (changePct < 0) decliningStocks++;
    });

    const averageChangePercent = Number((totalChangePercent / totalStocks).toFixed(2));
    let marketDirection = 'Neutral';
    if (averageChangePercent > 0.1) marketDirection = 'Bullish';
    else if (averageChangePercent < -0.1) marketDirection = 'Bearish';

    res.status(200).json({
      success: true,
      data: {
        totalStocks,
        averageChangePercent,
        advancingStocks,
        decliningStocks,
        marketDirection,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get top 10 gainers
// @route   GET /api/stocks/market/gainers
// @access  Public
exports.getTopGainers = async (req, res, next) => {
  try {
    const gainers = await Stock.find({})
      .sort({ changePercent: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: gainers.length,
      data: gainers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get top 10 losers
// @route   GET /api/stocks/market/losers
// @access  Public
exports.getTopLosers = async (req, res, next) => {
  try {
    const losers = await Stock.find({})
      .sort({ changePercent: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: losers.length,
      data: losers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
exports.getStockBySymbol = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${symbol} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get 90-day mock historical chart data for symbol
// @route   GET /api/stocks/:symbol/chart
// @access  Public
exports.getStockChart = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${symbol} not found.`,
      });
    }

    const currentPrice = stock.currentPrice;
    const days = 90;
    const chartData = [];

    // Realistic random walk going backwards from current price or forwards to current price
    // We'll generate backwards from day 0 (today) to day 89, then reverse so it's chronological
    let lastClose = currentPrice;
    const baseVolume = stock.volume ? Math.round(stock.volume / 20) : 1000000;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (i === 0) {
        const open = stock.previousClose || Number((currentPrice * 0.99).toFixed(2));
        const high = Number((Math.max(open, currentPrice) * (1 + Math.random() * 0.015)).toFixed(2));
        const low = Number((Math.min(open, currentPrice) * (1 - Math.random() * 0.015)).toFixed(2));
        chartData.push({
          date: dateStr,
          open,
          high,
          low,
          close: currentPrice,
          volume: stock.volume || baseVolume,
        });
      } else {
        // Daily return between -3% and +3%
        const dailyReturn = (Math.random() - 0.49) * 0.04;
        const prevClose = Number((lastClose / (1 + dailyReturn)).toFixed(2));
        const dayOpen = Number((prevClose * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
        const high = Number((Math.max(dayOpen, lastClose) * (1 + Math.random() * 0.015)).toFixed(2));
        const low = Number((Math.min(dayOpen, lastClose) * (1 - Math.random() * 0.015)).toFixed(2));
        const volume = Math.round(baseVolume * (0.7 + Math.random() * 0.6));

        chartData.push({
          date: dateStr,
          open: dayOpen,
          high,
          low,
          close: lastClose,
          volume,
        });

        lastClose = prevClose;
      }
    }

    // Sort chronologically ascending
    chartData.reverse();

    res.status(200).json({
      success: true,
      symbol,
      data: chartData,
    });
  } catch (err) {
    next(err);
  }
};
