const RoomType = require('../models/RoomType');
const Room = require('../models/Room');

const addRoomType = async (req, res) => {
  try {
    const { hotel, type, totalRooms, price } = req.body;

    // Create RoomType
    const roomType = new RoomType({
      hotel,
      type,
      totalRooms,
      availableRooms: totalRooms,
      price
    });
    await roomType.save();

    // Create Rooms with room numbers (1 to totalRooms)
    const roomDocs = [];
    for (let i = 1; i <= totalRooms; i++) {
      roomDocs.push({
        hotel,
        roomType: roomType._id,
        roomNumber: i,
        status: 'available'
      });
    }

    await Room.insertMany(roomDocs);

    res.status(201).json({ message: 'Room type and rooms created', roomType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getRoomsByHotel = async (req, res) => {
  try {
    const hotelId = req.params.hotelId;

    const rooms = await Room.find({ hotel: hotelId })
      .populate('roomType', 'type price') // populate room type details
      .sort({ roomNumber: 1 }); // optional: sorted by room number

    res.status(200).json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get room type
const getRoomTypes = async (req, res) => {
  const { hotelId } = req.params;

  try {
    // Step 1: Get all room types of this hotel
    const roomTypes = await RoomType.find({ hotel: hotelId });

    // Step 2: For each room type, get associated rooms
    const data = await Promise.all(
      roomTypes.map(async (roomType) => {
        const rooms = await Room.find({ roomType: roomType._id }).select('roomNumber status');
        return {
          ...roomType.toObject(),
          rooms,
        };
      })
    );

    res.status(200).json({ roomTypes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// mew api

const getRoomsByHotelAndType = async (req, res) => {
  try {
    const { hotelId, roomTypeId } = req.params;

    if (!hotelId || !roomTypeId) {
      return res.status(400).json({ message: "hotelId and roomTypeId are required" });
    }

    const rooms = await Room.find({ hotel: hotelId, roomType: roomTypeId })
      .populate('roomType', 'type price')
      .sort({ roomNumber: 1 });

    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// update room price by date
const updateRoomPriceByDate = async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const { date, price } = req.body;

    if (!date || !price) {
      return res.status(400).json({ message: 'Date and price are required' });
    }

    const targetDate = new Date(date);
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'RoomType not found' });
    }

    // Check if entry for the date exists
    const rateIndex = roomType.ratesByDate.findIndex(rate =>
      new Date(rate.date).toDateString() === targetDate.toDateString()
    );

    if (rateIndex > -1) {
      // Update existing price
      roomType.ratesByDate[rateIndex].price = price;
    } else {
      // Add new date-price entry
      roomType.ratesByDate.push({ date: targetDate, price });
    }

    await roomType.save();

    res.status(200).json({
      message: 'Room price updated successfully for the date',
      ratesByDate: roomType.ratesByDate
    });
  } catch (error) {
    console.error('Error updating room price by date:', error);
    res.status(500).json({ error: error.message });
  }
};



module.exports={
  addRoomType, 
  getRoomsByHotel,
  getRoomTypes,
  getRoomsByHotelAndType,
  updateRoomPriceByDate
}