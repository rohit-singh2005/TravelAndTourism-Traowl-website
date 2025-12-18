const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['hero', 'about', 'services', 'testimonials', 'contact', 'blog', 'trips'],
    unique: true
  },
  title: {
    type: String,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  mobileImage: {
    type: String // Optional separate image for mobile
  },
  buttonText: {
    type: String,
    trim: true
  },
  buttonLink: {
    type: String,
    trim: true
  },
  overlay: {
    enabled: {
      type: Boolean,
      default: true
    },
    opacity: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    color: {
      type: String,
      default: '#000000'
    }
  },
  textPosition: {
    type: String,
    enum: ['center', 'left', 'right', 'top', 'bottom'],
    default: 'center'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  lastModifiedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes
bannerSchema.index({ type: 1, isActive: 1 });
bannerSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);