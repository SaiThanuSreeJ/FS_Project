const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const User = require('../models/User');

// Helper function to calculate enriched holdings and portfolio totals
const calculatePortfolioMetrics = async (userId) => {
  const holdings = await Portfolio.find({ user: userId });

  let totalInvested = 0;
  let totalCurrentValue = 0;

  const enrichedHoldings = await Promise.all(
    holdings.map(async (h) => {
      const stock = await Stock.findOne({ symbol: h.symbol });
      const currentPrice = stock ? stock.currentPrice : h.averageBuyPrice;
      const sector = stock ? stock.sector : 'Other';
      const companyName = stock ? stock.companyName : h.companyName;

      const investedValue = Number((h.quantity * h.averageBuyPrice).toFixed(2));
      const currentValue = Number((h.quantity * currentPrice).toFixed(2));
      const pnl = Number((currentValue - investedValue).toFixed(2));
      const pnlPercent = investedValue > 0
        ? Number(((pnl / investedValue) * 100).toFixed(2))
        : 0;

      totalInvested += investedValue;
      totalCurrentValue += currentValue;

      return {
        _id: h._id,
        symbol: h.symbol,
        companyName,
        sector,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice,
        investedValue,
        currentValue,
        pnl,
        pnlPercent,
        createdAt: h.createdAt,
      };
    })
  );

  totalInvested = Number(totalInvested.toFixed(2));
  totalCurrentValue = Number(totalCurrentValue.toFixed(2));
  const totalPnL = Number((totalCurrentValue - totalInvested).toFixed(2));
  const totalPnLPercent = totalInvested > 0
    ? Number(((totalPnL / totalInvested) * 100).toFixed(2))
    : 0;

  return {
    holdings: enrichedHoldings,
    totals: {
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
    },
  };
};

// @desc    Get user portfolio holdings with live calculations
// @route   GET /api/portfolio
// @access  Private
exports.getHoldings = async (req, res, next) => {
  try {
    const { holdings, totals } = await calculatePortfolioMetrics(req.user.id);
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        holdings,
        totals: {
          ...totals,
          walletBalance: user ? user.virtualWalletBalance : 0,
          netWorth: Number(((user ? user.virtualWalletBalance : 0) + totals.totalCurrentValue).toFixed(2)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get portfolio summary with asset allocation by sector
// @route   GET /api/portfolio/summary
// @access  Private
exports.getPortfolioSummary = async (req, res, next) => {
  try {
    const { holdings, totals } = await calculatePortfolioMetrics(req.user.id);
    const user = await User.findById(req.user.id);

    // Calculate allocation by sector
    const sectorMap = {};
    holdings.forEach((h) => {
      const sector = h.sector || 'Other';
      if (!sectorMap[sector]) {
        sectorMap[sector] = 0;
      }
      sectorMap[sector] += h.currentValue;
    });

    const allocation = Object.keys(sectorMap).map((sector) => {
      const value = Number(sectorMap[sector].toFixed(2));
      const percentage = totals.totalCurrentValue > 0
        ? Number(((value / totals.totalCurrentValue) * 100).toFixed(2))
        : 0;
      return {
        sector,
        value,
        percentage,
      };
    });

    // Sort allocation descending by percentage
    allocation.sort((a, b) => b.percentage - a.percentage);

    res.status(200).json({
      success: true,
      data: {
        holdings,
        totals: {
          ...totals,
          walletBalance: user ? user.virtualWalletBalance : 0,
          netWorth: Number(((user ? user.virtualWalletBalance : 0) + totals.totalCurrentValue).toFixed(2)),
        },
        allocation,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Deposit funds into virtual wallet
// @route   POST /api/portfolio/deposit
// @access  Private
exports.deposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be a positive number greater than 0.',
      });
    }

    if (numAmount > 10000000) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount cannot exceed $10,000,000 in a single transaction.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { virtualWalletBalance: numAmount } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully deposited $${numAmount.toFixed(2)}.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualWalletBalance: user.virtualWalletBalance,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Withdraw funds from virtual wallet
// @route   POST /api/portfolio/withdraw
// @access  Private
exports.withdraw = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be a positive number greater than 0.',
      });
    }

    // Atomically check and deduct from wallet
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, virtualWalletBalance: { $gte: numAmount } },
      { $inc: { virtualWalletBalance: -numAmount } },
      { new: true }
    );

    if (!user) {
      const currentUser = await User.findById(req.user.id);
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Requested: $${numAmount.toFixed(2)}, Available: $${currentUser ? currentUser.virtualWalletBalance.toFixed(2) : '0.00'}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully withdrew $${numAmount.toFixed(2)}.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualWalletBalance: user.virtualWalletBalance,
      },
    });
  } catch (err) {
    next(err);
  }
};
