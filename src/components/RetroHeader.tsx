import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, getMessages, isCurrentUserAdmin } from "@/lib/store";
import { useNavigate } from "react-router-dom";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V13h6v8" />
  </svg>
);

const IconListings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconInbox = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21c0-3.87-3.58-7-8-7s-8 3.13-8 7" />
  </svg>
);

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
          <IconHome />
          <span>Home</span>
        </Link>
        <Link to="/listings" className={`bm-bottom-nav-item ${isActive("/listings") ? "active" : ""}`}>
          <IconListings />
          <span>Listings</span>
        </Link>
        <Link to="/create-listing" className={`bm-bottom-nav-item ${isActive("/create-listing") ? "active" : ""}`}>
          <span className="bm-bottom-icon-plus"><IconPlus /></span>
          <span>Verkaufen</span>
        </Link>
        <Link to="/messages" className={`bm-bottom-nav-item ${isActive("/messages") ? "active" : ""}`}>
          <span style={{ position: "relative" }}>
            <IconInbox />
            {unread > 0 && <span className="bm-bottom-badge">{unread}</span>}
          </span>
          <span>Inbox</span>
        </Link>
        <Link to="/dashboard" className={`bm-bottom-nav-item ${isActive("/dashboard") ? "active" : ""}`}>
          <IconProfile />
          <span>Profil</span>
        </Link>
      </nav>
    </>
  );
}
