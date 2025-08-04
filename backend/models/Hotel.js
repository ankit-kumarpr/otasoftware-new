const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  image: String, // ← NEW
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  closedDates: [Date],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
