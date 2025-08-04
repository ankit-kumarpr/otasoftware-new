import React, { useEffect, useState } from 'react';
import BASE_URL from '../../config';
import axios from 'axios';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Event as DateIcon,
  Hotel as HotelIcon,
  KingBed as RoomIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Phone as PhoneIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const BookingHistory = () => {
  const theme = useTheme();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('token');
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  useEffect(() => {
    getHistory();
  }, []);

  useEffect(() => {
    applyFiltersAndMapData();
  }, [bookings, dateFilter, statusFilter, roomTypeFilter, paginationModel]);

  const getHistory = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/booking/bookinghistory`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const response = await axios.get(url, { headers });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.log(error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndMapData = () => {
    let result = [...bookings];

    if (dateFilter) {
      const selectedDate = new Date(dateFilter).setHours(0, 0, 0, 0);
      result = result.filter(booking => {
        const startDate = new Date(booking.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(booking.endDate).setHours(0, 0, 0, 0);
        return selectedDate >= startDate && selectedDate <= endDate;
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter);
    }

    if (roomTypeFilter !== 'all') {
      result = result.filter(booking => 
        booking.roomType?.type?.toLowerCase() === roomTypeFilter.toLowerCase()
      );
    }

    const finalData = result.map((booking, index) => ({
      _id: booking._id,
      serialNumber: index + 1,
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      aadharNumber: booking.aadharNumber,
      hotelName: booking.hotel?.name || 'N/A',
      roomTypeName: booking.roomType?.type || 'N/A',
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      quantity: booking.quantity,
    }));
    
    setFilteredBookings(finalData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCancelBooking = (bookingId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const url = `${BASE_URL}/booking/cancelbooking/${bookingId}`;
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          };
          
          const response = await axios.post(url, {}, { headers });

          if (response.data) {
             Swal.fire({
              title: 'Cancelled!',
              text: 'The booking has been successfully cancelled.',
              icon: 'success',
              background: theme.palette.background.paper,
              color: theme.palette.text.primary
            });
            setBookings(prevBookings => 
              prevBookings.map(booking => 
                booking._id === bookingId ? { ...booking, status: 'cancelled' } : booking
              )
            );
          }
        } catch (error) {
          console.log(error);
          Swal.fire({
            title: 'Failed!',
            text: 'Something went wrong while cancelling the booking.',
            icon: 'error',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary
          });
        }
      }
    });
  };

  const handleDateChange = (e) => setDateFilter(e.target.value);
  const handleStatusFilterChange = (event) => setStatusFilter(event.target.value);
  const handleRoomTypeFilterChange = (event) => setRoomTypeFilter(event.target.value);

  const resetFilters = () => {
    setDateFilter('');
    setStatusFilter('all');
    setRoomTypeFilter('all');
  };

  const refreshData = () => {
    getHistory();
  };

  const roomTypes = [...new Set(bookings.map(booking => booking.roomType?.type).filter(Boolean))];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'booked': return <PendingIcon color="warning" fontSize="small" />;
      case 'cancelled': return <CancelIcon color="error" fontSize="small" />;
      case 'completed': return <CompletedIcon color="success" fontSize="small" />;
      default: return null;
    }
  };

  const columns = [
    { 
      field: 'serialNumber', 
      headerName: '#', 
      width: 60, 
      sortable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="textSecondary">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'customerName', 
      headerName: 'Customer Name', 
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.primary.main }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography fontWeight="500">{params.value}</Typography>
            <Typography variant="caption" color="textSecondary" display="flex" alignItems="center">
              <PhoneIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              {params.row.phoneNumber}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: 'hotelName', 
      headerName: 'Hotel', 
      width: 160,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <HotelIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'roomTypeName', 
      headerName: 'Room Type', 
      width: 140,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <RoomIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'dates', 
      headerName: 'Dates', 
      width: 200, 
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <DateIcon color="action" fontSize="small" sx={{ mr: 1 }} />
          <Box>
            <Typography variant="body2">{formatDate(params.row.startDate)}</Typography>
            <Typography variant="caption" color="textSecondary" display="block" textAlign="center">
              to
            </Typography>
            <Typography variant="body2">{formatDate(params.row.endDate)}</Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          {getStatusIcon(params.value)}
          <Chip 
            label={params.value}
            color={
              params.value === 'booked' ? 'warning' : 
              params.value === 'cancelled' ? 'error' : 
              'success'
            }
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
      )
    },
    { 
      field: 'details', 
      headerName: 'Details', 
      width: 200, 
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" display="flex" alignItems="center">
            <Typography component="span" fontWeight="500" mr={1}>Aadhar:</Typography>
            {params.row.aadharNumber}
          </Typography>
          <Typography variant="body2" display="flex" alignItems="center">
            <Typography component="span" fontWeight="500" mr={1}>Rooms:</Typography>
            {params.row.quantity}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 120, 
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Cancel booking">
          <span>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={() => handleCancelBooking(params.row._id)}
              disabled={params.row.status !== 'booked'}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          </span>
        </Tooltip>
      )
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
      <CardHeader 
        title={
          <Typography variant="h5" fontWeight="600">
            Booking History
          </Typography>
        }
        action={
          <Box>
            <Tooltip title="Refresh data">
              <IconButton onClick={refreshData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="outlined" 
              onClick={resetFilters} 
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2 }}
            >
              Reset Filters
            </Button>
          </Box>
        }
        sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 2
        }}
      />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              label="Filter by Date" 
              type="date" 
              value={dateFilter} 
              onChange={handleDateChange} 
              fullWidth 
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <DateIcon color="action" sx={{ mr: 1 }} />
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select 
                value={statusFilter} 
                label="Status" 
                onChange={handleStatusFilterChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select 
                value={roomTypeFilter} 
                label="Room Type" 
                onChange={handleRoomTypeFilterChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Room Types</MenuItem>
                {roomTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={refreshData}
              sx={{ height: '56px', borderRadius: 2 }}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ 
          height: 600, 
          width: '100%',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.background.default,
            borderBottom: `2px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
        }}>
          <DataGrid
          style={{marginTop:"18px"}}
            rows={filteredBookings}
            columns={columns}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            rowHeight={80}
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      </CardContent>
    </Paper>
  );
};

export default BookingHistory;