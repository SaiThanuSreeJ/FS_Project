const express = require('express');
const {
  getAllStocks,
  searchStocks,
  getMarketOverview,
  getTopGainers,
  getTopLosers,
  getStockBySymbol,
  getStockChart,
} = require('../controllers/stockController');

const router = express.Router();

// Specific routes MUST come before /:symbol
router.get('/', getAllStocks);
router.get('/search', searchStocks);
router.get('/market/overview', getMarketOverview);
router.get('/market/gainers', getTopGainers);
router.get('/market/losers', getTopLosers);

// Parameterized routes
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/chart', getStockChart);

module.exports = router;
