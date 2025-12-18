const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String }, // For help/support
  message: { type: String, required: true },
  type: { type: String, enum: ['contact', 'support'], default: 'contact' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema); 