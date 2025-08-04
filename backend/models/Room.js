// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
