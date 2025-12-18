const mongoose = require('mongoose');

const topDestinationSchema = new mongoose.Schema({
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
  images: [{
    type: String
  }],
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['trending', 'popular', 'beach', 'mountain', 'city', 'cultural', 'adventure', 'spiritual', 'romantic']
  },
  location: {
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  price: {
    startingFrom: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: '₹'
    }
  },
  duration: {
    min: {
      type: Number,
      default: 3 // days
    },
    max: {
      type: Number,
      default: 7 // days
    }
  },
  bestTime: {
    months: [{
      type: String,
      enum: ['January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December']
    }],
    season: {
      type: String,
      enum: ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter']
    }
  },
  highlights: [{
    type: String
  }],
  activities: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  popularityScore: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
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
topDestinationSchema.index({ category: 1, isActive: 1 });
topDestinationSchema.index({ 'location.country': 1, 'location.state': 1 });
topDestinationSchema.index({ isFeatured: 1, isActive: 1 });
topDestinationSchema.index({ isPopular: 1, isActive: 1 });
topDestinationSchema.index({ popularityScore: -1 });
topDestinationSchema.index({ tags: 1 });

// Text search index
topDestinationSchema.index({
  name: 'text',
  description: 'text',
  'location.state': 'text',
  'location.city': 'text',
  highlights: 'text',
  activities: 'text',
  tags: 'text'
});

module.exports = mongoose.model('TopDestination', topDestinationSchema);