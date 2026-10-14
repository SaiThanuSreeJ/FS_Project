const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for watchlist'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Watchlist name is required'],
    trim: true,
    default: 'My Watchlist',
  },
  symbols: {
    type: [String],
    default: [],
    validate: {
      validator: function (val) {
        return val.length <= 50;
      },
      message: 'A watchlist cannot contain more than 50 symbols',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index on user and name
watchlistSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
