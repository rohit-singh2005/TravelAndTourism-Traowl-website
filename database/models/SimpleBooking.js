const mongoose = require('mongoose');

// Simple booking schema that matches the current form
const simpleBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  tripTitle: {
    type: String,
    required: true
  },
  tripId: {
    type: String,
    default: null
  },
  travelers: {
    type: Number,
    required: true,
    min: 1
  },
  selectedDate: {
    type: Date,
    default: null
  },
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  specialRequests: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending_confirmation', 'confirmed', 'cancelled', 'completed'],
    default: 'pending_confirmation'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Generate booking ID before saving
simpleBookingSchema.pre('save', function(next) {
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
// bookingId index already created by unique: true
simpleBookingSchema.index({ status: 1 });
simpleBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SimpleBooking', simpleBookingSchema);