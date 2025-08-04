const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  addRoomType,
  getRoomsByHotel,
  getRoomTypes,
  getRoomsByHotelAndType,
  updateRoomPriceByDate
} = require('../controllers/roomController');

router.post('/addroomtype', auth, addRoomType);
// router.put('/:id/price', auth, updateRoomPriceByDate);
router.get('/gethotelrooms/:hotelId',getRoomsByHotel)
router.get('/roomtypehotel/:hotelId', getRoomTypes);

router.get('/rooms/:hotelId/:roomTypeId', getRoomsByHotelAndType);
router.post('/updateroomprice/:roomTypeId',updateRoomPriceByDate);

module.exports = router;
