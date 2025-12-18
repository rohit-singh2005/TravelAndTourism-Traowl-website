const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['adventure', 'winter-sports', 'aerial-sports', 'water-sports', 'cultural', 'spiritual', 'nature', 'city-tour']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'beginner', 'moderate', 'intermediate', 'difficult', 'expert']
  },
  duration: {
    type: String,
    default: 'Half day'
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: '₹'
  },
  location: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  bookingCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
activitySchema.index({ category: 1, isActive: 1 });
activitySchema.index({ difficulty: 1 });
activitySchema.index({ isFeatured: 1, isActive: 1 });
activitySchema.index({ tags: 1 });

// Text search index
activitySchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  location: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Activity', activitySchema);