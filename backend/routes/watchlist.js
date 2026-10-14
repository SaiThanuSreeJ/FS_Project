const express = require('express');
const {
  getWatchlists,
  createWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  deleteWatchlist,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All watchlist routes are protected
router.use(protect);

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.post('/:id/add', addToWatchlist);
router.delete('/:id/remove/:symbol', removeFromWatchlist);
router.delete('/:id', deleteWatchlist);

module.exports = router;
