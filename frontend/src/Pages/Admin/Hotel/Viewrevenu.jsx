import React, { useEffect, useState } from 'react';
import BASE_URL from '../../config';
import axios from 'axios';
import dayjs from 'dayjs';

// MUI Components
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';

// Icons
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import BedIcon from '@mui/icons-material/Bed';
import EventIcon from '@mui/icons-material/Event';
import HotelIcon from '@mui/icons-material/Hotel';
import PeopleIcon from '@mui/icons-material/People';

// Custom Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    backgroundColor: color, 
    color: '#fff', 
    height: '100%',
    borderRadius: 2,
    boxShadow: 3,
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)'
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography variant="h6" component="div" sx={{ ml: 1.5, fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const ViewRevenue = () => {
  const token = sessionStorage.getItem('token');
  
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Fetch all hotels
  useEffect(() => {
    const fetchAllHotels = async () => {
      try {
        const url = `${BASE_URL}/hotel/gethotels`;
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(url, { headers });
        setHotels(response.data.hotels || response.data);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError('Failed to load hotels.');
      }
    };
    fetchAllHotels();
  }, [token]);

  // Get revenue data
  const handleGetRevenue = async () => {
    if (!selectedHotel || !startDate || !endDate) {
      setError('Please select a hotel and a valid date range.');
      return;
    }
    
    setLoading(true);
    setError('');
    setRevenueData(null);

    try {
      const url = `${BASE_URL}/booking/revenue/${selectedHotel}/${startDate}/${endDate}`;
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(url, { headers });
      setRevenueData(response.data);

    } catch (err) {
      console.error("Error fetching revenue:", err);
      setError('Could not fetch revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedHotel('');
    setStartDate(dayjs().startOf('month').format('YYYY-MM-DD'));
    setEndDate(dayjs().format('YYYY-MM-DD'));
    setRevenueData(null);
    setError('');
  }

  // Format date for display
  const formatDisplayDate = (dateString) => {
    return dayjs(dateString).format('DD MMM YYYY');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardHeader
          title="Hotel Revenue Dashboard"
          titleTypographyProps={{ 
            variant: 'h4', 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
          sx={{ 
            backgroundColor: 'primary.light', 
            color: 'white',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        />
        <CardContent>
          {/* Filter Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Filter Revenue Data
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="hotel-select-label">Select Hotel</InputLabel>
                  <Select
                    labelId="hotel-select-label"
                    value={selectedHotel}
                    label="Select Hotel"
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    sx={{ backgroundColor: 'background.paper' }}
                  >
                    {hotels.map((hotel) => (
                      <MenuItem key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleGetRevenue} 
                    disabled={loading}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    {loading ? 'Loading...' : 'Get Revenue'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Results Section */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={60} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {revenueData && (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard 
                    title="Total Revenue" 
                    value={`₹${revenueData.totalRevenue.toLocaleString('en-IN')}`}
                    icon={<MonetizationOnIcon fontSize="large" />}
                    color="#2e7d32" // Green
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard 
                    title="Total Bookings" 
                    value={revenueData.bookingCount} 
                    icon={<BookOnlineIcon fontSize="large" />}
                    color="#1976d2" // Blue
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard 
                    title="Avg. Revenue" 
                    value={`₹${(revenueData.totalRevenue / revenueData.bookingCount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<EventIcon fontSize="large" />}
                    color="#9c27b0" // Purple
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard 
                    title="Hotel" 
                    value={hotels.find(h => h._id === selectedHotel)?.name || 'N/A'}
                    icon={<HotelIcon fontSize="large" />}
                    color="#ff9800" // Orange
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Booking Details Table */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Booking Details
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'primary.light' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Booking ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Room Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Dates</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueData.details.map((booking) => (
                      <TableRow key={booking.bookingId}>
                        <TableCell>{booking.bookingId.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon sx={{ mr: 1, color: 'action.active' }} />
                            {booking.customerName}
                          </Box>
                        </TableCell>
                        <TableCell>{booking.roomType}</TableCell>
                        <TableCell>
                          {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                        </TableCell>
                        <TableCell>{booking.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          ₹{booking.bookingRevenue.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                p: 2,
                backgroundColor: 'primary.light',
                color: 'white',
                borderRadius: 1
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total: ₹{revenueData.totalRevenue.toLocaleString('en-IN')} from {revenueData.bookingCount} bookings
                </Typography>
              </Box>
            </Box>
          )}
          
          {!loading && !revenueData && !error && (
            <Paper sx={{ 
              textAlign: 'center', 
              my: 5, 
              p: 4, 
              backgroundColor: 'background.default', 
              borderRadius: 2,
              boxShadow: 1
            }}>
              <MonetizationOnIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select a hotel and date range to view revenue analytics
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 3 }}
                onClick={() => {
                  setSelectedHotel(hotels[0]?._id || '');
                  setStartDate(dayjs().startOf('month').format('YYYY-MM-DD'));
                  setEndDate(dayjs().format('YYYY-MM-DD'));
                }}
                disabled={hotels.length === 0}
              >
                Load Sample Data
              </Button>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ViewRevenue;