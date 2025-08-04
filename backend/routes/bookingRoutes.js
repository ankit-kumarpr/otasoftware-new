const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  bookRoom,
  cancelBooking,
  getBookedRoomsInRange,
  getAllBookings,
  calculateRevenue,
  getThreeMonthRevenueHistory
} = require("../controllers/bookingController");

router.post("/book", auth, bookRoom);
router.post("/cancelbooking/:bookingId", auth, cancelBooking);
router.get("/booked-rooms/:hotel/:roomType", auth, getBookedRoomsInRange);
router.get('/bookinghistory',auth, getAllBookings);
router.get('/revenue/:hotelId/:startDate/:endDate',calculateRevenue);
router.get('/last3monthrevenue',auth,getThreeMonthRevenueHistory)
module.exports = router;
