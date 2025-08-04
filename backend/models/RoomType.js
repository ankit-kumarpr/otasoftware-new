const mongoose = require('mongoose');

const RoomTypeSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  type: String,
  totalRooms: Number,
  availableRooms: Number,
  price: Number,
  ratesByDate: [{
    date: Date,
    price: Number
  }],
}, { timestamps: true });

module.exports = mongoose.model('RoomType', RoomTypeSchema);
