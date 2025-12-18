const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  travelers: [{
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: String,
    email: String,
    specialRequests: String
  }],
  totalTravelers: {
    type: Number,
    required: true,
    min: 1
  },
  selectedDate: {
    type: Date,
    required: true
  },
  pricing: {
    basePrice: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash'],
      default: 'razorpay'
    },
    transactionId: String,
    paidAmount: { type: Number, default: 0 },
    paymentDate: Date,
    refundAmount: { type: Number, default: 0 },
    refundDate: Date
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled', 'completed'],
    default: 'draft'
  },
  contactInfo: {
    primaryContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  specialRequests: String,
  cancellation: {
    isCancelled: { type: Boolean, default: false },
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full', 'processing'],
      default: 'none'
    }
  },
  notes: [{
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `TRW${year}${month}${day}${random}`;
  }
  next();
});

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ trip: 1, selectedDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
// bookingId index already created by unique: true

module.exports = mongoose.model('Booking', bookingSchema);