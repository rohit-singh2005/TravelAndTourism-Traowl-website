const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'header', 
      'footer', 
      'about-us', 
      'contact-info', 
      'hero-section', 
      'corporate-page',
      'home-content',
      'policies',
      'terms-conditions',
      'privacy-policy',
      'seo-settings',
      'social-media'
    ],
    unique: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  lastModifiedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes
// type index already created by unique: true
siteContentSchema.index({ isActive: 1 });

module.exports = mongoose.model('SiteContent', siteContentSchema);