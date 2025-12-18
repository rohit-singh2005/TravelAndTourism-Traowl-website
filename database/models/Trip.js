const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: '₹'
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['hot-location', 'upcoming-trip', 'weekend-trip', 'domestic-trip', 'international-trip', 'family-trip', 'romantic-trip', 'corporate-trip', 'spiritual-tour']
  },
  subCategory: {
    type: String, // For more specific categorization like 'city tour', 'beach tour', 'temple', etc.
    trim: true
  },
  subCategory: {
    type: String, // For more specific categorization like 'city tour', 'beach tour', 'temple', etc.
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Difficult', 'Easy to Moderate'],
    default: 'Easy'
  },
  suitableFor: {
    type: String,
    default: 'All ages'
  },
  maxGroupSize: {
    type: Number,
    default: 50
  },
  minGroupSize: {
    type: Number,
    default: 4
  },
  joinDates: [{
    type: String
  }],
  highlights: [{
    type: String
  }],
  included: [{
    type: String
  }],
  excluded: [{
    type: String
  }],
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    activities: [String],
    meals: [String],
    accommodation: String
  }],
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
tripSchema.index({ category: 1, isActive: 1 });
tripSchema.index({ destination: 1 });
tripSchema.index({ price: 1 });
tripSchema.index({ isFeatured: 1, isActive: 1 });
tripSchema.index({ tags: 1 });

// Text search index
tripSchema.index({
  title: 'text',
  description: 'text',
  destination: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Trip', tripSchema);