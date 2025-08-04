const Hotel = require("../models/Hotel");
const path = require("path");

const addHotel = async (req, res) => {
  const { name, location } = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    const hotel = new Hotel({
      name,
      location,
      image,
      createdBy: req.admin,
    });
    await hotel.save();
    res.status(201).json({ hotel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateHotelStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const hotel = await Hotel.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ msg: "Status updated", hotel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addClosedDates = async (req, res) => {
  const { dates } = req.body;
  const hotel = await Hotel.findById(req.params.id);
  hotel.closedDates = [...new Set([...hotel.closedDates, ...dates])];
  await hotel.save();
  res.json({ msg: "Closed dates added", hotel });
};

const getAllHotels = async (req, res) => {
  const hotels = await Hotel.find({ createdBy: req.admin });
  res.json(hotels);
};

module.exports = {
  addHotel,
  updateHotelStatus,
  addClosedDates,
  getAllHotels,
};
