const Watchlist = require('../models/Watchlist');
const Stock = require('../models/Stock');

// @desc    Get all watchlists for logged-in user populated with stock data
// @route   GET /api/watchlist
// @access  Private
exports.getWatchlists = async (req, res, next) => {
  try {
    const watchlists = await Watchlist.find({ user: req.user.id });

    // Fetch stock details for each symbol in user's watchlists
    const enrichedWatchlists = await Promise.all(
      watchlists.map(async (list) => {
        const stocks = await Stock.find({ symbol: { $in: list.symbols } });
        return {
          _id: list._id,
          user: list.user,
          name: list.name,
          symbols: list.symbols,
          stocks,
          createdAt: list.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedWatchlists.length,
      data: enrichedWatchlists,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new watchlist
// @route   POST /api/watchlist
// @access  Private
exports.createWatchlist = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Watchlist name is required.',
      });
    }

    const trimmedName = name.trim();

    // Check if user already has a watchlist with this name
    const existing = await Watchlist.findOne({
      user: req.user.id,
      name: trimmedName,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Watchlist with name "${trimmedName}" already exists.`,
      });
    }

    const watchlist = await Watchlist.create({
      user: req.user.id,
      name: trimmedName,
      symbols: [],
    });

    res.status(201).json({
      success: true,
      data: watchlist,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a stock symbol to watchlist
// @route   POST /api/watchlist/:id/add
// @access  Private
exports.addToWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.body;

    if (!symbol || symbol.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required.',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();

    // Verify stock exists in db
    const stockExists = await Stock.findOne({ symbol: upperSymbol });
    if (!stockExists) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${upperSymbol} does not exist.`,
      });
    }

    // Find watchlist and verify ownership
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or unauthorized.',
      });
    }

    // Prevent duplicate symbol
    if (watchlist.symbols.includes(upperSymbol)) {
      return res.status(400).json({
        success: false,
        message: `Symbol ${upperSymbol} is already in this watchlist.`,
      });
    }

    // Check max 50 items
    if (watchlist.symbols.length >= 50) {
      return res.status(400).json({
        success: false,
        message: 'Watchlist cannot contain more than 50 symbols.',
      });
    }

    watchlist.symbols.push(upperSymbol);
    await watchlist.save();

    // Also fetch current stocks for response
    const stocks = await Stock.find({ symbol: { $in: watchlist.symbols } });

    res.status(200).json({
      success: true,
      data: {
        ...watchlist.toObject(),
        stocks,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a stock symbol from watchlist
// @route   DELETE /api/watchlist/:id/remove/:symbol
// @access  Private
exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const symbolToRemove = req.params.symbol.toUpperCase();

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or unauthorized.',
      });
    }

    if (!watchlist.symbols.includes(symbolToRemove)) {
      return res.status(400).json({
        success: false,
        message: `Symbol ${symbolToRemove} is not in this watchlist.`,
      });
    }

    watchlist.symbols = watchlist.symbols.filter((s) => s !== symbolToRemove);
    await watchlist.save();

    const stocks = await Stock.find({ symbol: { $in: watchlist.symbols } });

    res.status(200).json({
      success: true,
      data: {
        ...watchlist.toObject(),
        stocks,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete entire watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
exports.deleteWatchlist = async (req, res, next) => {
  try {
    const watchlist = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Watchlist deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
