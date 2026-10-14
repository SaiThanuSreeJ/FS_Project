const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price must be positive'],
    },
    previousClose: {
      type: Number,
      required: [true, 'Previous close price is required'],
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    high52Week: {
      type: Number,
    },
    low52Week: {
      type: Number,
    },
    marketCap: {
      type: Number,
    },
    volume: {
      type: Number,
    },
    sector: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: change = currentPrice - previousClose
stockSchema.virtual('change').get(function () {
  if (this.currentPrice !== undefined && this.previousClose !== undefined) {
    return Number((this.currentPrice - this.previousClose).toFixed(2));
  }
  return 0;
});

module.exports = mongoose.model('Stock', stockSchema);
