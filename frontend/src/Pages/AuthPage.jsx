import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AuthAnimation.css";
import BASE_URL from "./config";
import { FaHotel, FaLock, FaEnvelope, FaSignInAlt } from "react-icons/fa";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false,
  });

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const LoginAPI = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error("Please fill in all fields");
    return;
  }

  setLoading(true);

  try {
    const url = `${BASE_URL}/admin/login`;
    const headers = {
      "Content-Type": "application/json",
    };
    const requestBody = {
      email: email,
      password: password,
    };
    console.log("request body", requestBody);

    const response = await axios.post(url, requestBody, { headers });
    console.log("Response of login api", response.data);

    const { token, admin } = response.data;

    // ✅ Store in sessionStorage
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("adminId", admin.id);
    sessionStorage.setItem("email", admin.email);
    sessionStorage.setItem("role", "admin"); // Optional if you're using role-based UI

    toast.success("Login successful!");

    // ✅ Redirect to Admin Dashboard
    window.location.href = "/admin/dashboard";

  } catch (error) {
    console.error(error);
    toast.error("Login failed. Please check your credentials.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="auth-page">
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">
            <FaHotel className="hotel-icon" />
            <h1>Grand Horizon</h1>
            <p>Hotel Booking Admin Panel</p>
          </div>

          <div className="auth-animation">
            <div className="hotel-building">
              <div className="windows">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="window"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <form onSubmit={LoginAPI} className="auth-form">
            <h2>Admin Login</h2>
            <p>Please enter your credentials to access the dashboard</p>

            <div className={`form-group ${isFocused.email ? "focused" : ""}`}>
              <label htmlFor="email">Email</label>
              <div className="input-group">
                <span className="input-icon">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleFocus("email")}
                  onBlur={() => handleBlur("email")}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div
              className={`form-group ${isFocused.password ? "focused" : ""}`}
            >
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleFocus("password")}
                  onBlur={() => handleBlur("password")}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="form-options">
              <div className="form-check">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="/forgot-password" className="forgot-password">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              © {new Date().getFullYear()} Grand Horizon Hotels. All rights
              reserved.
            </p>
            <p>
              Need help? <a href="/support">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
