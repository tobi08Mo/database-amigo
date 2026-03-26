import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, getMessages, isCurrentUserAdmin } from "@/lib/store";
import { useNavigate } from "react-router-dom";

export default function RetroHeader() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = user ? getMessages().filter(m => m.to === user.username && !m.read).length : 0;
  const isAdmin = isCurrentUserAdmin();

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* Desktop top bar */}
      <div className="bm-topbar">
        <Link to="/home" className="bm-topbar-logo" style={{ textDecoration: "none" }}>
          <img src="/images/logo.png" alt="Basta Market" />
          <span>BASTA <span className="market-text">MARKET</span></span>
        </Link>
        <div className="bm-topbar-nav bm-desktop-nav">
          <Link to="/home">Home</Link>
          <Link to="/listings">Listings</Link>
          <Link to="/search">Suche</Link>
          <Link to="/create-listing">Verkaufen</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/messages">
            Inbox{unread > 0 && <span style={{ color: "hsl(40 80% 60%)" }}> ({unread})</span>}
          </Link>
          {isAdmin && (
            <Link to="/admin" style={{ color: "hsl(0 70% 65%)" }}>Admin</Link>
          )}
          <span style={{ color: "hsl(0 0% 25%)", margin: "0 4px" }}>|</span>
          <Link to={`/profile/${user?.username}`} style={{ color: "hsl(0 0% 80%)" }}>{user?.username}</Link>
          <span className="bm-ltc" style={{ fontSize: 11 }}>{user?.ltcBalance.toFixed(4)} LTC</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="bm-bottom-nav">
        <Link to="/home" className={`bm-bottom-nav-item ${isActive("/home") ? "active" : ""}`}>
          <span className="bm-bottom-icon">🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/listings" className={`bm-bottom-nav-item ${isActive("/listings") ? "active" : ""}`}>
          <span className="bm-bottom-icon">📦</span>
          <span>Listings</span>
        </Link>
        <Link to="/create-listing" className={`bm-bottom-nav-item ${isActive("/create-listing") ? "active" : ""}`}>
          <span className="bm-bottom-icon bm-bottom-icon-plus">+</span>
          <span>Verkaufen</span>
        </Link>
        <Link to="/messages" className={`bm-bottom-nav-item ${isActive("/messages") ? "active" : ""}`}>
          <span className="bm-bottom-icon">
            ✉{unread > 0 && <span className="bm-bottom-badge">{unread}</span>}
          </span>
          <span>Inbox</span>
        </Link>
        <Link to="/dashboard" className={`bm-bottom-nav-item ${isActive("/dashboard") ? "active" : ""}`}>
          <span className="bm-bottom-icon">👤</span>
          <span>Profil</span>
        </Link>
      </nav>
    </>
  );
}
