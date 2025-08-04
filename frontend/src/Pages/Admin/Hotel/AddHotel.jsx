import { useEffect, useState } from "react"
import axios from "axios"
import BASE_URL from "../../config"
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  Stack,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Skeleton,
  Divider,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Container,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MeetingRoom as RoomIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { styled } from "@mui/material/styles"
import dayjs from "dayjs"

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: "100vh",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}))

const HeaderCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
}))

const StatsCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  color: "white",
  textAlign: "center",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
  },
}))

const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.spacing(3),
    padding: theme.spacing(1),
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
}))

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  color: "white",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 12px 35px rgba(102, 126, 234, 0.4)",
  },
}))

const ModernHotelCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.spacing(3),
  overflow: "hidden",
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  "&:hover": {
    transform: "translateY(-10px) scale(1.02)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
  },
}))

const ModernCardMedia = styled(CardMedia)({
  height: 200,
  position: "relative",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
})

const StatusChip = styled(Chip)(({ theme, status }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  background:
    status === "active"
      ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
      : "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
  color: "white",
  fontWeight: 600,
  borderRadius: theme.spacing(2),
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.2)",
}))

const ImageUploadArea = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: `3px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  cursor: "pointer",
  transition: "all 0.3s ease",
  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  "&:hover": {
    borderColor: theme.palette.primary.dark,
    background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
    transform: "scale(1.02)",
  },
}))

const ActionButton = styled(IconButton)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  margin: theme.spacing(0.5),
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
    transform: "scale(1.1)",
  },
}))

const EmptyStateCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6),
  textAlign: "center",
  border: "2px dashed #e2e8f0",
  minHeight: "400px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}))

const AddHotel = () => {
  const token = sessionStorage.getItem("token")
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    image: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState("")
  const [hotels, setHotels] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [roomFormData, setRoomFormData] = useState({
    type: "",
    totalRooms: "",
    availableRooms: "",
    price: "",
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: "",
    status: "active",
  })

  const handleOpen = () => setOpen(true)
  const handleClose = () => !isLoading && setOpen(false)

  useEffect(() => {
    getHotels()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.location || !formData.image) {
      toast.error("Please fill all fields and select an image")
      return
    }
    setIsLoading(true)
    try {
      const data = new FormData()
      data.append("name", formData.name)
      data.append("location", formData.location)
      data.append("image", formData.image)
      await axios.post(`${BASE_URL}/hotel/addhotel`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      toast.success("Hotel added successfully!")
      handleClose()
      resetForm()
      getHotels()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to add hotel")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", location: "", image: null })
    setPreviewImage("")
  }

  const getHotels = async () => {
    setIsFetching(true)
    try {
      const url = `${BASE_URL}/hotel/gethotels`
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
      const response = await axios.get(url, { headers })
      setHotels(response.data)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch hotels")
    } finally {
      setIsFetching(false)
    }
  }

  const handleOpenRoomDialog = (hotel) => {
    setSelectedHotel(hotel)
    setRoomDialogOpen(true)
  }

  const handleCloseRoomDialog = () => {
    setRoomDialogOpen(false)
    setSelectedHotel(null)
    setRoomFormData({
      type: "",
      totalRooms: "",
      availableRooms: "",
      price: "",
    })
  }

  const handleRoomInputChange = (e) => {
    const { name, value } = e.target
    setRoomFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddRoomType = async () => {
    if (!roomFormData.type || !roomFormData.totalRooms || !roomFormData.price) {
      toast.error("Please fill all required fields")
      return
    }
    try {
      const payload = {
        hotel: selectedHotel._id,
        type: roomFormData.type,
        totalRooms: Number(roomFormData.totalRooms),
        availableRooms: Number(roomFormData.availableRooms || roomFormData.totalRooms),
        price: Number(roomFormData.price),
      }
      await axios.post(`${BASE_URL}/room/addroomtype`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      toast.success("Room type added successfully!")
      handleCloseRoomDialog()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to add room type")
    }
  }

  const handleOpenEditDialog = (hotel) => {
    setEditFormData({
      id: hotel._id,
      status: hotel.status || "active",
    })
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditFormData({
      id: "",
      status: "active",
    })
  }

  const handleStatusChange = (e) => {
    setEditFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }))
  }

  const updateHotelStatus = async () => {
    try {
      await axios.put(
        `${BASE_URL}/hotel/updatehotel/${editFormData.id}`,
        { status: editFormData.status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      toast.success("Hotel status updated successfully!")
      getHotels()
      handleCloseEditDialog()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to update hotel status")
    }
  }

  return (
    <StyledContainer maxWidth="xl">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Section */}
      <Fade in timeout={800}>
        <HeaderCard elevation={0}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "600",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize:"24px"
                }}
              >
                <BusinessIcon sx={{ fontSize: 32, color: "#667eea" }} />
                Hotel Management
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                Manage your hotel properties with ease and efficiency
              </Typography>
            </Box>
            <GradientButton startIcon={<AddIcon />} onClick={handleOpen} size="large">
              Add New Hotel
            </GradientButton>
          </Stack>

          {/* Stats Section */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <StatsCard elevation={0}>
                <HotelIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {hotels.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Hotels
                </Typography>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCard elevation={0} sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                <StarIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {hotels.filter((h) => h.status === "active").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Active Hotels
                </Typography>
              </StatsCard>
            </Grid>
          </Grid>
        </HeaderCard>
      </Fade>

      {/* Add Hotel Dialog */}
      <ModernDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                  <HotelIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Add New Hotel
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a new hotel property
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleClose} disabled={isLoading}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            <Stack spacing={4}>
              <TextField
                fullWidth
                label="Hotel Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter hotel name"
                required
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: <HotelIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter hotel location"
                required
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              <input
                accept="image/*"
                id="hotel-image-upload"
                type="file"
                style={{ display: "none" }}
                onChange={handleImageChange}
                required
                disabled={isLoading}
              />
              <label htmlFor="hotel-image-upload">
                <ImageUploadArea>
                  {previewImage ? (
                    <img
                      src={previewImage || "/placeholder.svg"}
                      alt="Hotel preview"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "300px",
                        objectFit: "contain",
                        borderRadius: "12px",
                      }}
                    />
                  ) : (
                    <>
                      <Avatar sx={{ bgcolor: "primary.main", mb: 2, width: 64, height: 64 }}>
                        <ImageIcon fontSize="large" />
                      </Avatar>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        Click to upload hotel image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supports JPG, PNG up to 5MB
                      </Typography>
                    </>
                  )}
                </ImageUploadArea>
              </label>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} disabled={isLoading} sx={{ borderRadius: 3, px: 4 }}>
              Cancel
            </Button>
            <GradientButton
              type="submit"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            >
              {isLoading ? "Processing..." : "Add Hotel"}
            </GradientButton>
          </DialogActions>
        </form>
      </ModernDialog>

      {/* Edit Hotel Status Dialog */}
      <ModernDialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "warning.main" }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Update Hotel Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Change the operational status
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={editFormData.status} label="Status" onChange={handleStatusChange} sx={{ borderRadius: 2 }}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseEditDialog} sx={{ borderRadius: 3, px: 4 }}>
            Cancel
          </Button>
          <GradientButton onClick={updateHotelStatus} startIcon={<EditIcon />}>
            Update Status
          </GradientButton>
        </DialogActions>
      </ModernDialog>

      {/* Add Room Type Dialog */}
      <ModernDialog open={roomDialogOpen} onClose={handleCloseRoomDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "success.main" }}>
              <RoomIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Add Room Type
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedHotel?.name}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Type"
                name="type"
                value={roomFormData.type}
                onChange={handleRoomInputChange}
                placeholder="e.g., Deluxe, Suite, Standard"
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Rooms"
                name="totalRooms"
                type="number"
                value={roomFormData.totalRooms}
                onChange={handleRoomInputChange}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Available Rooms"
                name="availableRooms"
                type="number"
                value={roomFormData.availableRooms}
                onChange={handleRoomInputChange}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Night"
                name="price"
                type="number"
                value={roomFormData.price}
                onChange={handleRoomInputChange}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseRoomDialog} sx={{ borderRadius: 3, px: 4 }}>
            Cancel
          </Button>
          <GradientButton onClick={handleAddRoomType} startIcon={<AddIcon />}>
            Add Room Type
          </GradientButton>
        </DialogActions>
      </ModernDialog>

      {/* Hotels Grid */}
      <Box>
        {isFetching ? (
          <Grid container spacing={4}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : hotels.length === 0 ? (
          <Zoom in timeout={600}>
            <EmptyStateCard elevation={0}>
              <HotelIcon sx={{ fontSize: 120, color: "text.disabled", mb: 3 }} />
              <Typography variant="h4" color="text.secondary" fontWeight="bold" gutterBottom>
                No Hotels Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
                Start building your hotel empire by adding your first property. It's quick and easy to get started!
              </Typography>
              <GradientButton startIcon={<AddIcon />} onClick={handleOpen} size="large">
                Add Your First Hotel
              </GradientButton>
            </EmptyStateCard>
          </Zoom>
        ) : (
          <Grid container spacing={4}>
            {hotels.map((hotel, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={hotel._id}>
                <Zoom in timeout={600 + index * 100}>
                  <ModernHotelCard>
                    <ModernCardMedia 
                      image={`https://otasoftware-new.onrender.com/uploads/hotels/${hotel.image}`}
                      title={hotel.name}
                      sx={{
                        backgroundImage: `url(${BASE_URL}/uploads/hotels/${hotel.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <StatusChip label={hotel.status?.toUpperCase()} status={hotel.status} size="small" />
                    </ModernCardMedia>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                        {hotel.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <LocationIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {hotel.location}
                        </Typography>
                      </Stack>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(hotel.createdAt).format("MMM D, YYYY")}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {hotel.closedDates?.length || 0} closed dates
                        </Typography>
                      </Stack>
                    </CardContent>
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center", gap: 1 }}>
                      <Tooltip title="Edit Hotel">
                        <ActionButton onClick={() => handleOpenEditDialog(hotel)} size="small">
                          <EditIcon fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title="Add Room Type">
                        <ActionButton onClick={() => handleOpenRoomDialog(hotel)} size="small">
                          <RoomIcon fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                   
                    </Box>
                  </ModernHotelCard>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </StyledContainer>
  )
}

export default AddHotel
