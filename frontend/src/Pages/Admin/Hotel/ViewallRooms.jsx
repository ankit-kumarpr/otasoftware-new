import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../config";
import "./ViewallRooms.css";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isBetween from "dayjs/plugin/isBetween";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

const ViewallRooms = () => {
  const [hostels, setHostels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [roomDetails, setRoomDetails] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dates, setDates] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [roomsPerPage] = useState(15);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookedRooms, setBookedRooms] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // States for inline price editing
  const [editingCell, setEditingCell] = useState(null); // Updated state: { roomId: '...', date: 'YYYY-MM-DD' }
  const [editablePrice, setEditablePrice] = useState("");
  const [priceOverrides, setPriceOverrides] = useState({}); // { 'YYYY-MM-DD': newPrice }

  const [bookingData, setBookingData] = useState({
    customerName: "",
    phoneNumber: "",
    aadharNumber: "",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
  });

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/hotel/gethotels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHostels(res.data);
      } catch (err) {
        console.error("Error fetching hotels:", err);
      }
    };
    fetchHotels();
  }, [token]);

  useEffect(() => {
    generateDatesForMonth(monthOffset);
  }, [monthOffset]);

  const generateDatesForMonth = (offset) => {
    const start = dayjs().add(offset, "month").startOf("month");
    const end = dayjs().add(offset, "month").endOf("month");
    const newDates = [];
    for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
      newDates.push(d);
    }
    setDates(newDates);
  };

  useEffect(() => {
    let filtered = roomDetails;
    if (searchTerm) {
      filtered = filtered.filter((room) =>
        room.roomNumber.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((room) => {
        const roomFromApi = bookedRooms.find((r) => r._id === room._id);
        const effectiveStatus =
          roomFromApi && roomFromApi.status ? roomFromApi.status : room.status;
        return effectiveStatus === statusFilter;
      });
    }
    setFilteredRooms(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roomDetails, bookedRooms]);

  useEffect(() => {
    if (selectedHotel && selectedRoomType) {
      fetchRoomStatus();
    }
  }, [selectedHotel, selectedRoomType]);

  const fetchRoomStatus = async () => {
    setLoadingStatus(true);
    try {
      const url = `${BASE_URL}/booking/booked-rooms/${selectedHotel}/${selectedRoomType}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookedRooms(response.data.rooms || []);
    } catch (error) {
      console.error("Error fetching room status:", error);
      setBookedRooms([]);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchRoomTypes = async (hotelId, hotelName) => {
    try {
      setSelectedHotel(hotelId);
      setSelectedHotelName(hotelName);
      setRoomTypes([]);
      setRoomDetails([]);
      setSelectedRoomType(null);
      setSearchTerm("");
      setStatusFilter("all");
      setPriceOverrides({});
      setEditingCell(null);

      const res = await axios.get(`${BASE_URL}/room/roomtypehotel/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoomTypes(res.data.roomTypes || []);
    } catch (err) {
      console.error("Error fetching room types:", err);
    }
  };

  const handleHotelClick = (hotel) => {
    fetchRoomTypes(hotel._id, hotel.name);
  };

  const handleRoomTypeClick = (roomType) => {
    setSelectedRoomType(roomType._id);
    setRoomDetails(roomType.rooms || []);
    setPriceOverrides({});
    setEditingCell(null);
  };

  const getFormattedDate = (date) => {
    if (dayjs(date).isToday()) return "Today";
    if (dayjs(date).isTomorrow()) return "Tomorrow";
    return dayjs(date).format("DD MMM ddd");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return "A";
      case "booked":
        return "B";
      case "maintenance":
        return "M";
      default:
        return "-";
    }
  };

  const isRoomBookedForDate = (roomId, date) => {
    const roomFromApi = bookedRooms.find((room) => room._id === roomId);
    if (!roomFromApi || !roomFromApi.startDate || !roomFromApi.endDate) {
      return false;
    }
    return dayjs(date).isBetween(
      dayjs(roomFromApi.startDate),
      dayjs(roomFromApi.endDate),
      "day",
      "[]"
    );
  };

  const handleUpdatePrice = async (date) => {
    const originalPrice =
      priceOverrides[date.format("YYYY-MM-DD")] ||
      roomTypes.find((rt) => rt._id === selectedRoomType)?.price;
    const newPrice = Number(editablePrice);

    if (
      isNaN(newPrice) ||
      editablePrice === "" ||
      newPrice === Number(originalPrice)
    ) {
      setEditingCell(null);
      return;
    }

    try {
      const url = `${BASE_URL}/room/updateroomprice/${selectedRoomType}`;
      const body = {
        price: newPrice,
        date: date.format("YYYY-MM-DD"),
      };
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(url, body, { headers });

      setPriceOverrides((prev) => ({
        ...prev,
        [date.format("YYYY-MM-DD")]: newPrice,
      }));
    } catch (error) {
      console.error(
        "Error updating price:",
        error.response?.data || error.message
      );
      alert("Failed to update price. Please try again.");
    } finally {
      setEditingCell(null);
      setEditablePrice("");
    }
  };

  const handleOpenBookingDialog = (room) => {
    setSelectedRoom(room);
    setBookingData({
      customerName: "",
      phoneNumber: "",
      aadharNumber: "",
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
    });
    setOpenBookingDialog(true);
  };

  const handleCloseBookingDialog = () => {
    setOpenBookingDialog(false);
    setSelectedRoom(null);
  };

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const BookAnyRoom = async () => {
    try {
      await axios.post(
        `${BASE_URL}/booking/book`,
        {
          hotel: selectedHotel,
          roomType: selectedRoomType,
          quantity: 1,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          customerName: bookingData.customerName,
          phoneNumber: bookingData.phoneNumber,
          aadharNumber: bookingData.aadharNumber,
          rooms: [selectedRoom._id],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRoomStatus();
      handleCloseBookingDialog();
    } catch (error) {
      console.error("Booking error:", error.response?.data || error.message);
      alert("Booking failed. Please try again.");
    }
  };

  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  const getEffectiveStatus = (room) => {
    if (!bookedRooms || bookedRooms.length === 0) return room.status;
    const roomFromApi = bookedRooms.find((r) => r._id === room._id);
    return roomFromApi ? roomFromApi.status : room.status;
  };

  return (
    <div className="inventory-management-container">
      <h1 className="main-title">Manage Inventory, Rates And Restrictions</h1>

      <div className="hotel-selector">
        <h3>Select Hotel:</h3>
        <div className="hotel-buttons">
          {hostels.map((hotel) => (
            <button
              key={hotel._id}
              className={`hotel-btn ${
                selectedHotel === hotel._id ? "active" : ""
              }`}
              onClick={() => handleHotelClick(hotel)}
            >
              {hotel.name}
            </button>
          ))}
        </div>
      </div>

      {selectedHotel && (
        <div className="inventory-section">
          <div className="selected-hotel">Hotel: {selectedHotelName}</div>

          <div className="inventory-header">
            <div className="updates-column">
              <h4>Updates</h4>
              <div className="dynamic-pricing">
                <span>Dynamic Pricing</span>
              </div>
              <div className="rateplans-section">
                <h4>Show All Rateplans</h4>
                {roomTypes.map((roomType) => (
                  <div
                    key={roomType._id}
                    className={`rateplan ${
                      selectedRoomType === roomType._id ? "selected" : ""
                    }`}
                    onClick={() => handleRoomTypeClick(roomType)}
                  >
                    {roomType.type}
                    <span className="room-type-price">₹{roomType.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dates-header">
              {dates.map((date, idx) => (
                <div key={idx} className="date-column">
                  <div className="date-header">{getFormattedDate(date)}</div>
                  <div className="availability-status">GET</div>
                </div>
              ))}
            </div>
          </div>

          {selectedRoomType && (
            <>
              <div className="filters-section">
                <input
                  type="text"
                  placeholder="Search room number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="room-search-input"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {loadingStatus && (
                <div className="loading-message">Loading room status...</div>
              )}

              <div className="room-details-section">
                <div className="room-details-header">
                  <div className="room-number-header">Room No.</div>
                  {dates.map((date, idx) => (
                    <div key={idx} className="room-date-header">
                      {dayjs(date).format("DD/MM")}
                    </div>
                  ))}
                </div>

                <div className="room-details-body">
                  {currentRooms.map((room) => {
                    const effectiveStatus = getEffectiveStatus(room);
                    return (
                      <div key={room._id} className="room-row">
                        <div className="room-number">
                          <button
                            className={`room-btn ${
                              effectiveStatus !== "available" ? "disabled" : ""
                            }`}
                            onClick={() =>
                              effectiveStatus === "available" &&
                              handleOpenBookingDialog(room)
                            }
                            disabled={effectiveStatus !== "available"}
                          >
                            {room.roomNumber}
                          </button>
                        </div>
                        {dates.map((date, idx) => {
                          const isBookedForThisDate = isRoomBookedForDate(
                            room._id,
                            date
                          );

                          const cellStatus = isBookedForThisDate
                            ? "booked"
                            : effectiveStatus === "maintenance"
                            ? "maintenance"
                            : "available";

                          const basePrice = roomTypes.find(
                            (rt) => rt._id === selectedRoomType
                          )?.price;
                          const displayPrice =
                            priceOverrides[date.format("YYYY-MM-DD")] ||
                            basePrice;

                          // === SAHI LOGIC YAHAN HAI ===
                          // Check karein ki *yeh specific cell* edit ho raha hai ya nahi
                          const isEditing =
                            editingCell &&
                            editingCell.roomId === room._id &&
                            editingCell.date === date.format("YYYY-MM-DD");

                          return (
                            <div key={idx} className="room-status-cell">
                              <div
                                className={`room-status-badge ${cellStatus}`}
                              >
                                {getStatusBadge(cellStatus)}
                              </div>
                              <div className="room-price">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editablePrice}
                                    className="price-input"
                                    onChange={(e) =>
                                      setEditablePrice(e.target.value)
                                    }
                                    onBlur={() => handleUpdatePrice(date)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleUpdatePrice(date);
                                      if (e.key === "Escape")
                                        setEditingCell(null);
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  // === ONCLICK HANDLER MEIN SAHI LOGIC YAHAN HAI ===
                                  <span
                                    onClick={() => {
                                      if (cellStatus === "available") {
                                        setEditablePrice(displayPrice);
                                        // RoomId aur date dono ko state mein set karein
                                        setEditingCell({
                                          roomId: room._id,
                                          date: date.format("YYYY-MM-DD"),
                                        });
                                      }
                                    }}
                                  >
                                    ₹{displayPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {`<`}
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "active" : ""}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      {`>`}
                    </button>
                  </div>
                )}
              </div>

              <div className="date-navigation">
                <button onClick={() => setMonthOffset((m) => m - 1)}>
                  {"<"} Previous Month
                </button>
                <div className="date-range">
                  {dayjs(dates[0]).format("MMMM YYYY")}
                </div>
                <button onClick={() => setMonthOffset((m) => m + 1)}>
                  Next Month {">"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={openBookingDialog} onClose={handleCloseBookingDialog}>
        <DialogTitle>
          Book Room {selectedRoom?.roomNumber} - {selectedHotelName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="customerName"
            label="Customer Name"
            fullWidth
            variant="standard"
            value={bookingData.customerName}
            onChange={handleBookingInputChange}
            required
          />
          <TextField
            margin="dense"
            name="phoneNumber"
            label="Phone Number"
            fullWidth
            variant="standard"
            value={bookingData.phoneNumber}
            onChange={handleBookingInputChange}
            required
          />
          <TextField
            margin="dense"
            name="aadharNumber"
            label="Aadhar Number"
            fullWidth
            variant="standard"
            value={bookingData.aadharNumber}
            onChange={handleBookingInputChange}
            required
          />
          <TextField
            margin="dense"
            name="startDate"
            label="Start Date"
            type="date"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            value={bookingData.startDate}
            onChange={handleBookingInputChange}
            inputProps={{ min: dayjs().format("YYYY-MM-DD") }}
          />
          <TextField
            margin="dense"
            name="endDate"
            label="End Date"
            type="date"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            value={bookingData.endDate}
            onChange={handleBookingInputChange}
            inputProps={{ min: bookingData.startDate }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingDialog}>Cancel</Button>
          <Button
            onClick={BookAnyRoom}
            disabled={
              !bookingData.customerName ||
              !bookingData.phoneNumber ||
              !bookingData.aadharNumber
            }
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ViewallRooms;
