const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');


const bookRoom = async (req, res) => {
  try {
    const {
      hotel,
      roomType,
      quantity,
      startDate,
      endDate,
      customerName,
      phoneNumber,
      aadharNumber,
      rooms // Array of room IDs
    } = req.body;

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check if all rooms exist and belong to the correct hotel and room type
    const existingRooms = await Room.find({
      _id: { $in: rooms },
      hotel,
      roomType
    });

    if (existingRooms.length !== rooms.length) {
      return res.status(400).json({ message: 'Some rooms are invalid or do not match the selected hotel/room type' });
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      rooms: { $in: rooms },
      $or: [
        { 
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) }
        }
      ]
    }).populate('rooms', 'roomNumber');

    if (overlappingBookings.length > 0) {
      const conflictingRooms = [...new Set(
        overlappingBookings.flatMap(booking => 
          booking.rooms.map(room => room.roomNumber)
        )
      )];
      return res.status(400).json({ 
        message: 'Some rooms are already booked for the selected dates',
        conflictingRooms
      });
    }

    // Create booking
    const booking = new Booking({
      hotel,
      roomType,
      quantity,
      startDate,
      endDate,
      customerName,
      phoneNumber,
      aadharNumber,
      rooms
    });

    await booking.save();

    // ✅ Update status of booked rooms to 'booked'
    await Room.updateMany(
      { _id: { $in: rooms } },
      { $set: { status: 'booked' } }
    );

    // ✅ Update RoomType availableRooms count
    await RoomType.findByIdAndUpdate(roomType, {
      $inc: { availableRooms: -quantity }
    });

    res.status(201).json({ 
      message: 'Rooms booked successfully', 
      booking,
      bookedRooms: rooms 
    });

  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// const cancelBooking = async (req, res) => {
//   const booking = await Booking.findById(req.params.id);
//   if (!booking || booking.status === 'cancelled') {
//     return res.status(400).json({ msg: 'Booking already cancelled' });
//   }

//   booking.status = 'cancelled';
//   await booking.save();

//   const room = await RoomType.findById(booking.roomType);
//   room.availableRooms += booking.quantity;
//   await room.save();

//   res.json({ msg: 'Booking cancelled', booking });
// };

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    console.log("booking in backend",booking);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { rooms, roomType, quantity } = booking;

    // Update rooms status back to 'available'
    await Room.updateMany(
      { _id: { $in: rooms } },
      { $set: { status: 'available' } }
    );

    // Increment the availableRooms count in RoomType
    await RoomType.findByIdAndUpdate(roomType, {
      $inc: { availableRooms: quantity }
    });

    // Delete the booking OR mark it as cancelled (your choice)
    await Booking.findByIdAndDelete(bookingId);
    // OR:
    // await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });

    res.status(200).json({
      message: 'Booking cancelled successfully',
      cancelledRooms: rooms
    });

  } catch (err) {
    console.error('Cancel Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
};


const getBookedRoomsInRange = async (req, res) => {
  try {
    const { hotel, roomType } = req.params;

    if (!hotel || !roomType) {
      return res.status(400).json({ message: "Hotel and roomType are required" });
    }

    // Step 1: Get all rooms for given hotel and roomType
    const allRooms = await Room.find({ hotel, roomType }).populate('hotel roomType');

    // Step 2: Get all bookings that include these rooms
    const bookings = await Booking.find({
      hotel,
      roomType,
      rooms: { $in: allRooms.map(r => r._id) }
    })
      .sort({ createdAt: -1 }) // latest first
      .populate('rooms', 'roomNumber'); // to get roomNumber

    // Step 3: Map room ID to its latest booking dates
    const roomDateMap = {};

    bookings.forEach(booking => {
      booking.rooms.forEach(room => {
        if (!roomDateMap[room._id]) {
          roomDateMap[room._id] = {
            startDate: booking.startDate,
            endDate: booking.endDate
          };
        }
      });
    });

    // Step 4: Create final response array
    const roomStatusList = allRooms.map(room => ({
      _id: room._id,
      roomNumber: room.roomNumber,
      hotel: room.hotel?.name || '',
      roomType: room.roomType?.name || '',
      status: room.status,
      startDate: roomDateMap[room._id]?.startDate || null,
      endDate: roomDateMap[room._id]?.endDate || null
    }));

    res.status(200).json({ rooms: roomStatusList });
  } catch (err) {
    console.error("Room status fetch error:", err);
    res.status(500).json({ error: err.message });
  }
};


// booking history

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('hotel', 'name address') // optional: hotel details
      .populate('roomType', 'type price availableRooms') // optional: room type
      .populate('rooms', 'roomNumber status') // optional: room numbers
      .sort({ startDate: -1 }); // optional: latest bookings first

    res.status(200).json({
      message: 'All bookings fetched successfully',
      total: bookings.length,
      bookings // isme customerName, phoneNumber, aadharNumber already hote hain
    });

  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
};


// revenu calculate

const calculateRevenue = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.params;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookings = await Booking.find({
      hotel: hotelId,
      startDate: { $gte: start },
      endDate: { $lte: end },
      status: 'booked'
    })
      .populate('roomType', 'price type')
      .populate('hotel', 'name');

    let totalRevenue = 0;
    const detailedRevenue = [];

    for (const booking of bookings) {
      const pricePerRoom = booking.roomType?.price || 0;
      const quantity = booking.quantity;
      const bookingRevenue = pricePerRoom * quantity;
      totalRevenue += bookingRevenue;

      detailedRevenue.push({
        bookingId: booking._id,
        hotelName: booking.hotel?.name || 'N/A',
        customerName: booking.customerName,
        roomType: booking.roomType?.type,
        pricePerRoom,
        quantity,
        bookingRevenue,
        startDate: booking.startDate,
        endDate: booking.endDate
      });
    }

    res.status(200).json({
      message: 'Revenue calculated successfully',
      hotelId,
      totalRevenue,
      bookingCount: bookings.length,
      details: detailedRevenue
    });

  } catch (error) {
    console.error('Revenue Calculation Error:', error);
    res.status(500).json({ error: error.message });
  }
};


// get revenue of 3 months

const getThreeMonthRevenueHistory = async (req, res) => {
  try {
    const today = new Date();

    // Set fromDate = 1st of month, two months back
    const fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 1st June if today is 2 Aug
    const toDate = today;

    const bookings = await Booking.find({
      status: 'booked',
      startDate: { $gte: fromDate, $lte: toDate }
    }).populate('roomType', 'price');

    const historyMap = new Map();
    let totalRevenue = 0;

    bookings.forEach(booking => {
      const dateKey = booking.startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const price = booking.roomType?.price || 0;
      const revenue = price * booking.quantity;
      totalRevenue += revenue;

      if (historyMap.has(dateKey)) {
        historyMap.set(dateKey, historyMap.get(dateKey) + revenue);
      } else {
        historyMap.set(dateKey, revenue);
      }
    });

    const history = Array.from(historyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      message: '3-month revenue history fetched successfully',
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
      totalRevenue,
      history
    });

  } catch (error) {
    console.error('3-month Revenue History Error:', error);
    res.status(500).json({ error: error.message });
  }
};






module.exports={
  bookRoom, cancelBooking,getBookedRoomsInRange,getAllBookings,calculateRevenue,getThreeMonthRevenueHistory
} 