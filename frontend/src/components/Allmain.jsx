// components/Allmain.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./Header.jsx";
import SideBar from "./SideBar.jsx";
import AuthRoute from "./AuthRoute.jsx";
import Logout from "./LogOut.jsx";

import AdminDashboard from "../Pages/Admin/AdminDashboard.jsx";

import "./main.css";
import AddHotel from "../Pages/Admin/Hotel/AddHotel.jsx";
import ViewallRooms from "../Pages/Admin/Hotel/ViewallRooms.jsx";
import BookingHistory from "../Pages/Admin/Hotel/BookingHistory.jsx";
import Viewrevenu from "../Pages/Admin/Hotel/Viewrevenu.jsx";

const Allmain = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("");

  useEffect(() => {
    const routeToTitle = {
      "/admin/dashboard": "Admin Dashboard",
      "/user/dashboard": "User Dashboard",
      "/lawyer/dashboard": "Lawyer Dashboard",
      "/lawyer/Lawyer_Profile": "Lawyer Profile",
      "/admin/lawyerManagement": "Manage Lawyers",
      "/admin/customner": "Manage Customers",
      "/admin/add-lawyer": "Add Physical Lawyer",
      // ✅ fix typo if needed
    };

    const title = routeToTitle[location.pathname];
    setPageTitle(title || "");
    document.title = title ? `${title} | LawConnect` : "LawConnect";
  }, [location.pathname]);

  return (
    <>
      <Header />
      <SideBar />
      <main
        id="main"
        className="main"
        style={{ background: "#f9f7f1", minHeight: "100vh" }}
      >
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <AuthRoute>
                <AdminDashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/hotel/add"
            element={
              <AuthRoute>
                <AddHotel />
              </AuthRoute>
            }
          />
          <Route
            path="/hotel/rooms"
            element={
              <AuthRoute>
                <ViewallRooms />
              </AuthRoute>
            }
          />
          <Route
            path="/booking/history"
            element={
              <AuthRoute>
                <BookingHistory />
              </AuthRoute>
            }
          />
          <Route
            path="/booking/revenue"
            element={
              <AuthRoute>
                <Viewrevenu />
              </AuthRoute>
            }
          />

          <Route path="/logout" element={<Logout />} />
        </Routes>
      </main>
    </>
  );
};

export default Allmain;
