const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email address'
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.oauthProvider; // Password required only if not OAuth user
    },
    minlength: 6
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'facebook', null],
    default: null
  },
  oauthId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'editor', 'viewer', 'user'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'trips.view', 'trips.create', 'trips.edit', 'trips.delete',
      'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.delete',
      'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
      'content.view', 'content.create', 'content.edit', 'content.delete',
      'visual_editor.access',
      'system.settings',
      'admin.access'
    ]
  }],
  profile: {
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    preferences: {
      newsletter: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      language: { type: String, default: 'en' }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
// email index already created by unique: true
userSchema.index({ oauthProvider: 1, oauthId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// RBAC Methods
userSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  // Check explicit permissions
  if (this.permissions && this.permissions.includes(permission)) return true;
  
  // Role-based default permissions
  const rolePermissions = {
    admin: [
      'users.view', 'users.create', 'users.edit',
      'trips.view', 'trips.create', 'trips.edit', 'trips.delete',
      'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.delete',
      'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
      'content.view', 'content.create', 'content.edit', 'content.delete',
      'visual_editor.access',
      'admin.access'
    ],
    editor: [
      'trips.view', 'trips.create', 'trips.edit',
      'blogs.view', 'blogs.create', 'blogs.edit',
      'content.view', 'content.create', 'content.edit',
      'visual_editor.access',
      'admin.access'
    ],
    viewer: [
      'trips.view', 'bookings.view', 'blogs.view', 'content.view',
      'admin.access'
    ],
    user: []
  };
  
  const defaultPermissions = rolePermissions[this.role] || [];
  return defaultPermissions.includes(permission);
};

userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.hasAnyRole = function(roles) {
  return roles.includes(this.role);
};

userSchema.methods.canAccessAdmin = function() {
  return this.hasPermission('admin.access');
};

module.exports = mongoose.model('User', userSchema);