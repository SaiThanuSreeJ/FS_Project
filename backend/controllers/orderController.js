const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

// @desc    Execute a BUY order
// @route   POST /api/orders/buy
// @access  Private
exports.executeBuy = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', '),
        errors: errors.array(),
      });
    }

    const { symbol, quantity, category = 'MARKET', limitPrice } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required.',
      });
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer greater than or equal to 1.',
      });
    }

    const upperCategory = category.toUpperCase();
    if (!['MARKET', 'LIMIT'].includes(upperCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Category must be either MARKET or LIMIT.',
      });
    }

    if (upperCategory === 'LIMIT' && (limitPrice === undefined || limitPrice === null || limitPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'A valid limit price is required for LIMIT orders.',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();
    const stock = await Stock.findOne({ symbol: upperSymbol });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${upperSymbol} not found.`,
      });
    }

    // Determine execution:
    // If MARKET: executes immediately at stock.currentPrice
    // If LIMIT: executes immediately if stock.currentPrice <= limitPrice, otherwise stays PENDING
    const isLimit = upperCategory === 'LIMIT';
    const numLimitPrice = isLimit ? Number(limitPrice) : null;
    const canExecuteImmediately = !isLimit || stock.currentPrice <= numLimitPrice;

    if (!canExecuteImmediately) {
      // Order cannot execute at market right now. Create PENDING order
      // We reserve funds = quantity * limitPrice
      const pendingTotalCost = Number((numQty * numLimitPrice).toFixed(2));

      // Atomically check & deduct funds
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id, virtualWalletBalance: { $gte: pendingTotalCost } },
        { $inc: { virtualWalletBalance: -pendingTotalCost } },
        { new: true }
      );

      if (!updatedUser) {
        const currentUser = await User.findById(req.user.id);
        return res.status(400).json({
          success: false,
          message: `Insufficient funds. Required: $${pendingTotalCost}, Available: $${currentUser ? currentUser.virtualWalletBalance.toFixed(2) : '0.00'}`,
        });
      }

      const pendingOrder = await Order.create({
        user: req.user.id,
        symbol: upperSymbol,
        companyName: stock.companyName,
        orderType: 'BUY',
        category: 'LIMIT',
        quantity: numQty,
        price: stock.currentPrice,
        limitPrice: numLimitPrice,
        total: pendingTotalCost,
        status: 'PENDING',
        createdAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        order: pendingOrder,
        holding: null,
        walletBalance: updatedUser.virtualWalletBalance,
        message: 'LIMIT buy order placed and is currently PENDING.',
      });
    }

    // Immediate execution
    const executionPrice = stock.currentPrice;
    const totalCost = Number((numQty * executionPrice).toFixed(2));

    // Atomically deduct totalCost from user balance ensuring sufficient balance
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id, virtualWalletBalance: { $gte: totalCost } },
      { $inc: { virtualWalletBalance: -totalCost } },
      { new: true }
    );

    if (!updatedUser) {
      const currentUser = await User.findById(req.user.id);
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Required: $${totalCost}, Available: $${currentUser ? currentUser.virtualWalletBalance.toFixed(2) : '0.00'}`,
      });
    }

    // Update or create Portfolio holding
    let holding = await Portfolio.findOne({ user: req.user.id, symbol: upperSymbol });

    if (holding) {
      const existingQty = holding.quantity;
      const existingAvgPrice = holding.averageBuyPrice;
      const newQty = existingQty + numQty;
      const newAvgPrice = Number(
        (((existingQty * existingAvgPrice) + (numQty * executionPrice)) / newQty).toFixed(2)
      );

      holding.quantity = newQty;
      holding.averageBuyPrice = newAvgPrice;
      await holding.save();
    } else {
      holding = await Portfolio.create({
        user: req.user.id,
        symbol: upperSymbol,
        companyName: stock.companyName,
        quantity: numQty,
        averageBuyPrice: executionPrice,
        createdAt: new Date(),
      });
    }

    // Create Order record
    const order = await Order.create({
      user: req.user.id,
      symbol: upperSymbol,
      companyName: stock.companyName,
      orderType: 'BUY',
      category: upperCategory,
      quantity: numQty,
      price: executionPrice,
      limitPrice: numLimitPrice || undefined,
      total: totalCost,
      status: 'EXECUTED',
      executedAt: new Date(),
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      order,
      holding,
      walletBalance: updatedUser.virtualWalletBalance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Execute a SELL order
// @route   POST /api/orders/sell
// @access  Private
exports.executeSell = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', '),
        errors: errors.array(),
      });
    }

    const { symbol, quantity, category = 'MARKET', limitPrice } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required.',
      });
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer greater than or equal to 1.',
      });
    }

    const upperCategory = category.toUpperCase();
    if (!['MARKET', 'LIMIT'].includes(upperCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Category must be either MARKET or LIMIT.',
      });
    }

    if (upperCategory === 'LIMIT' && (limitPrice === undefined || limitPrice === null || limitPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'A valid limit price is required for LIMIT orders.',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();
    const stock = await Stock.findOne({ symbol: upperSymbol });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol ${upperSymbol} not found.`,
      });
    }

    // Check portfolio holding
    const holding = await Portfolio.findOne({ user: req.user.id, symbol: upperSymbol });
    if (!holding || holding.quantity < numQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient holdings. Owned: ${holding ? holding.quantity : 0}, Requested: ${numQty}`,
      });
    }

    const isLimit = upperCategory === 'LIMIT';
    const numLimitPrice = isLimit ? Number(limitPrice) : null;
    const canExecuteImmediately = !isLimit || stock.currentPrice >= numLimitPrice;

    if (!canExecuteImmediately) {
      // Create pending sell order, deduct holding quantity to avoid double-spend
      if (holding.quantity === numQty) {
        await Portfolio.findByIdAndDelete(holding._id);
      } else {
        holding.quantity -= numQty;
        await holding.save();
      }

      const pendingRevenue = Number((numQty * numLimitPrice).toFixed(2));
      const pendingOrder = await Order.create({
        user: req.user.id,
        symbol: upperSymbol,
        companyName: stock.companyName,
        orderType: 'SELL',
        category: 'LIMIT',
        quantity: numQty,
        price: stock.currentPrice,
        limitPrice: numLimitPrice,
        total: pendingRevenue,
        status: 'PENDING',
        createdAt: new Date(),
      });

      const user = await User.findById(req.user.id);
      return res.status(200).json({
        success: true,
        order: pendingOrder,
        holding: holding.quantity === numQty ? null : holding,
        walletBalance: user.virtualWalletBalance,
        message: 'LIMIT sell order placed and is currently PENDING.',
      });
    }

    // Immediate execution
    const executionPrice = stock.currentPrice;
    const totalRevenue = Number((numQty * executionPrice).toFixed(2));

    // Credit totalRevenue to user wallet
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { virtualWalletBalance: totalRevenue } },
      { new: true }
    );

    // Reduce holding quantity. If 0, delete holding document
    let updatedHolding = null;
    if (holding.quantity === numQty) {
      await Portfolio.findByIdAndDelete(holding._id);
    } else {
      holding.quantity -= numQty;
      await holding.save();
      updatedHolding = holding;
    }

    // Create Order record
    const order = await Order.create({
      user: req.user.id,
      symbol: upperSymbol,
      companyName: stock.companyName,
      orderType: 'SELL',
      category: upperCategory,
      quantity: numQty,
      price: executionPrice,
      limitPrice: numLimitPrice || undefined,
      total: totalRevenue,
      status: 'EXECUTED',
      executedAt: new Date(),
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      order,
      holding: updatedHolding,
      walletBalance: updatedUser.virtualWalletBalance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders for authenticated user
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active orders (PENDING)
// @route   GET /api/orders/active
// @access  Private
exports.getActiveOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      status: 'PENDING',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order history (EXECUTED or CANCELLED)
// @route   GET /api/orders/history
// @access  Private
exports.getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      status: { $in: ['EXECUTED', 'CANCELLED', 'REJECTED'] },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a pending order
// @route   DELETE /api/orders/:id
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized.',
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status ${order.status}. Only PENDING orders can be cancelled.`,
      });
    }

    // If BUY order, refund reserved funds to user wallet
    if (order.orderType === 'BUY') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { virtualWalletBalance: order.total },
      });
    } else if (order.orderType === 'SELL') {
      // If SELL order, restore shares back to portfolio holding
      const existingHolding = await Portfolio.findOne({
        user: req.user.id,
        symbol: order.symbol,
      });

      if (existingHolding) {
        existingHolding.quantity += order.quantity;
        await existingHolding.save();
      } else {
        await Portfolio.create({
          user: req.user.id,
          symbol: order.symbol,
          companyName: order.companyName,
          quantity: order.quantity,
          averageBuyPrice: order.price,
          createdAt: new Date(),
        });
      }
    }

    order.status = 'CANCELLED';
    await order.save();

    const updatedUser = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      order,
      walletBalance: updatedUser.virtualWalletBalance,
    });
  } catch (err) {
    next(err);
  }
};
