const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for portfolio holding'],
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
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  averageBuyPrice: {
    type: Number,
    required: [true, 'Average buy price is required'],
    min: [0, 'Average buy price cannot be negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index on user and symbol
portfolioSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
