const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for order'],
    index: true,
  },
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true,
  },
  companyName: {
    type: String,
    trim: true,
  },
  orderType: {
    type: String,
    enum: {
      values: ['BUY', 'SELL'],
      message: 'orderType must be either BUY or SELL',
    },
    required: [true, 'orderType is required'],
  },
  category: {
    type: String,
    enum: {
      values: ['MARKET', 'LIMIT'],
      message: 'category must be either MARKET or LIMIT',
    },
    default: 'MARKET',
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer',
    },
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be non-negative'],
  },
  limitPrice: {
    type: Number,
    min: [0, 'Limit price must be non-negative'],
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'],
      message: 'Invalid order status',
    },
    default: 'EXECUTED',
  },
  executedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for user, status, and createdAt sorting
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
