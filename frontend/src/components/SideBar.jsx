import React, { useState } from "react";
import "./sidebar.css";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaBook,
  FaFileContract,
  FaUserTie,
  FaGavel,
  FaHome,
  FaHistory,
  FaChartBar,
  FaCog,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClipboardList,
  FaUserPlus
} from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { MdOutlineProductionQuantityLimits, MdOutlineCategory } from "react-icons/md";
import { RiBriefcase4Fill } from "react-icons/ri";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const SideBar = () => {
  const [dropdowns, setDropdowns] = useState({
    clients: false,
    history: false
  });

  const toggleDropdown = (name) => {
    setDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        
        <li className="nav-item">
          <Link className="nav-link" to="/admin/dashboard">
            <FaChartBar size={20} />
            <span>Dashboard</span>
          </Link>
        </li>

       

        

        <li className="nav-item">
          <div
            className={`nav-link ${dropdowns.history ? "" : "collapsed"}`}
            onClick={() => toggleDropdown("history")}
            style={{ cursor: "pointer" }}
          >
            <RiBriefcase4Fill size={20} />
            <span>Hotels</span>
            {dropdowns.history ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
          </div>
          <ul className={`nav-content collapse ${dropdowns.history ? "show" : ""}`}>
            <li><Link to="/hotel/add"><i className="bi bi-circle" />Add Hotel</Link></li>
            <li><Link to="/hotel/rooms"><i className="bi bi-circle" /> Hotel Rooms</Link></li>
          </ul>
        </li>

         <li className="nav-item">
          <Link className="nav-link" to="/booking/history">
            <FaUserTie size={20} />
            <span>Bookings history</span>
          </Link>
        </li>
         <li className="nav-item">
          <Link className="nav-link" to="/booking/revenue">
            <FaUserTie size={20} />
            <span>Revenue</span>
          </Link>
        </li>

       

        <li className="nav-item">
          <Link className="nav-link" to="/logout">
            <i className="fas fa-sign-out-alt" />
            <span>Log Out</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default SideBar;
