const express = require("express");
const cors = require("cors");
const connectToDb = require("./DB/db");
const path = require('path');
const app = express();

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/admin", require("./routes/authRoutes"));
app.use("/api/hotel", require("./routes/hotelRoutes"));
app.use('/api/room', require('./routes/roomRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));

module.exports = app;
