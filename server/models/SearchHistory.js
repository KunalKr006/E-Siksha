const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  filters: {
    category: [String],
    level: [String],
    primaryLanguage: [String],
    priceRange: {
      min: Number,
      max: Number
    }
  },
  viewedCourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
searchHistorySchema.index({ userId: 1, timestamp: -1 });
searchHistorySchema.index({ query: 1 });
searchHistorySchema.index({ timestamp: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory; 