import { useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, logout, getMessages, isCurrentUserAdmin } from "@/lib/store";
import { useNavigate } from "react-router-dom";

export default function RetroHeader() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const unread = user ? getMessages().filter(m => m.to === user.username && !m.read).length : 0;
  const isAdmin = isCurrentUserAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="bm-topbar">
      <Link to="/home" className="bm-topbar-logo" style={{ textDecoration: "none" }}>
        <img src="/images/logo.png" alt="Basta Market" />
        <span>BASTA <span className="market-text">MARKET</span></span>
      </Link>

      {/* Mobile hamburger */}
      <button
        className="bm-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Nav links */}
      <div className={`bm-topbar-nav ${menuOpen ? "bm-topbar-nav--open" : ""}`}>
        <Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/listings" onClick={() => setMenuOpen(false)}>Listings</Link>
        <Link to="/search" onClick={() => setMenuOpen(false)}>Suche</Link>
        <Link to="/create-listing" onClick={() => setMenuOpen(false)}>Verkaufen</Link>
        <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/messages" onClick={() => setMenuOpen(false)}>
          Inbox{unread > 0 && <span style={{ color: "hsl(40 80% 60%)" }}> ({unread})</span>}
        </Link>
        {isAdmin && (
          <Link to="/admin" style={{ color: "hsl(0 70% 65%)" }} onClick={() => setMenuOpen(false)}>Admin</Link>
        )}
        <span className="bm-nav-divider">|</span>
        <Link to={`/profile/${user?.username}`} style={{ color: "hsl(0 0% 80%)" }} onClick={() => setMenuOpen(false)}>{user?.username}</Link>
        <span className="bm-ltc" style={{ fontSize: 11 }}>{user?.ltcBalance.toFixed(4)} LTC</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
