const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500,
    default: function() {
      return this.content ? this.content.substring(0, 200) + '...' : '';
    }
  },
  featuredImage: {
    type: String,
    default: 'images/blog-default.webp'
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    required: true,
    enum: ['travel-tips', 'destinations', 'culture', 'food', 'adventure', 'spiritual', 'guides']
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    name: {
      type: String,
      required: true,
      default: 'Traowl Team'
    },
    avatar: {
      type: String,
      default: 'images/author-default.webp'
    },
    bio: {
      type: String,
      default: 'Travel enthusiast and expert guide'
    }
  },
  readTime: {
    type: Number,
    default: 5 // minutes
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Create slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes for better performance
blogSchema.index({ category: 1, isPublished: 1 });
// slug index already created by unique: true
blogSchema.index({ isFeatured: 1, isPublished: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ tags: 1 });

// Text search index
blogSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Blog', blogSchema);