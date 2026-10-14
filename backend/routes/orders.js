const express = require('express');
const { check } = require('express-validator');
const {
  executeBuy,
  executeSell,
  getUserOrders,
  getActiveOrders,
  getOrderHistory,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes are protected
router.use(protect);

router.post(
  '/buy',
  [
    check('symbol', 'Stock symbol is required').notEmpty(),
    check('quantity', 'Quantity must be an integer >= 1').isInt({ min: 1 }),
    check('category', 'Category must be MARKET or LIMIT')
      .optional()
      .isIn(['MARKET', 'LIMIT', 'market', 'limit']),
  ],
  executeBuy
);

router.post(
  '/sell',
  [
    check('symbol', 'Stock symbol is required').notEmpty(),
    check('quantity', 'Quantity must be an integer >= 1').isInt({ min: 1 }),
    check('category', 'Category must be MARKET or LIMIT')
      .optional()
      .isIn(['MARKET', 'LIMIT', 'market', 'limit']),
  ],
  executeSell
);

router.get('/', getUserOrders);
router.get('/active', getActiveOrders);
router.get('/history', getOrderHistory);
router.delete('/:id', cancelOrder);

module.exports = router;
