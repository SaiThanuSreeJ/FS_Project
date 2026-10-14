const express = require('express');
const {
  getHoldings,
  getPortfolioSummary,
  deposit,
  withdraw,
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All portfolio routes are protected
router.use(protect);

router.get('/', getHoldings);
router.get('/summary', getPortfolioSummary);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

module.exports = router;
