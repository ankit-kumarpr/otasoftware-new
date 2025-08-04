"use client"

import React, { useState, useEffect } from "react"
import PageTitle from "../../components/PageTitle"
import "./admin.css"
import BASE_URL from "../config"
import axios from "axios"
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  Button,
  Divider,
  Stack,
  IconButton,
} from "@mui/material"
import {
  Hotel as HotelIcon,
  BookOnline as BookingIcon,
  MonetizationOn as RevenueIcon,
  MoreHoriz as MoreIcon,
} from "@mui/icons-material"

const AdminDashboard = () => {
  const token = sessionStorage.getItem("token")
  const theme = useTheme()

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalHotels: 0,
    totalBookings: 0,
    last3MonthsRevenue: 0,
    loading: true,
    error: null,
  })

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        // Fetch data in parallel
        const [hotelsRes, bookingsRes, revenueRes] = await Promise.all([
          axios.get(`${BASE_URL}/hotel/gethotels`, { headers }),
          axios.get(`${BASE_URL}/booking/bookinghistory`, { headers }),
          axios.get(`${BASE_URL}/booking/last3monthrevenue`, { headers }),
        ])

        setDashboardData({
          totalHotels: hotelsRes.data?.length || 0,
          totalBookings: bookingsRes.data?.bookings?.length || 0,
          last3MonthsRevenue: revenueRes.data?.totalRevenue || 0,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error("Dashboard error:", error)
        setDashboardData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load dashboard data",
        }))
      }
    }

    fetchDashboardData()
  }, [token])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Modern Dashboard Card Component
  const DashboardCard = ({ icon, title, value, onClick, gradient, showChart = false }) => (
    <Card
      onClick={onClick}
      sx={{
        height: "200px",
        width: "100%", // Ensure full width of grid item
        minWidth: "300px", // Set minimum width for consistency
        background: gradient,
        cursor: "pointer",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        borderRadius: "16px",
        border: "none",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255,255,255,0.1)",
          opacity: 0,
          transition: "opacity 0.3s ease",
        },
        "&:hover::before": {
          opacity: 1,
        },
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          p: 3,
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "12px",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            {React.cloneElement(icon, { sx: { color: "white", fontSize: 24 } })}
          </Box>

          <IconButton
            size="small"
            sx={{
              color: "rgba(255,255,255,0.8)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <MoreIcon />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1.8rem", sm: "2.2rem" },
            }}
          >
            {value}
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>

            {showChart && (
              <Box sx={{ opacity: 0.8 }}>
                <svg width="60" height="30" viewBox="0 0 60 30">
                  <path
                    d="M5,25 Q15,5 25,15 T45,10 T55,5"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="55" cy="5" r="2" fill="white" />
                </svg>
              </Box>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <>
      <PageTitle page={"Admin Dashboard"} />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Admin Dashboard Overview
        </Typography>

        {dashboardData.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : dashboardData.error ? (
          <Box
            sx={{
              p: 3,
              backgroundColor: theme.palette.error.light,
              color: theme.palette.error.contrastText,
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography>{dashboardData.error}</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                <DashboardCard
                  icon={<HotelIcon />}
                  title="Total Hotels"
                  value={dashboardData.totalHotels}
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  onClick={() => console.log("Navigate to hotels")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                <DashboardCard
                  icon={<BookingIcon />}
                  title="Total Bookings"
                  value={dashboardData.totalBookings}
                  gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  showChart={true}
                  onClick={() => console.log("Navigate to bookings")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                <DashboardCard
                  icon={<RevenueIcon />}
                  title="3-Month Revenue"
                  value={formatCurrency(dashboardData.last3MonthsRevenue)}
                  gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  onClick={() => console.log("Navigate to revenue")}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
          </>
        )}
      </Box>
    </>
  )
}

export default AdminDashboard