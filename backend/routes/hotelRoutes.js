const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  addHotel, updateHotelStatus, addClosedDates, getAllHotels
} = require('../controllers/hotelController');
const upload = require('../middleware/upload');

router.post('/addhotel', auth,upload.single('image'), addHotel);
router.put('/updatehotel/:id', auth, updateHotelStatus);
router.put('/closehotel/:id', auth, addClosedDates);
router.get('/gethotels', auth, getAllHotels);

module.exports = router;
