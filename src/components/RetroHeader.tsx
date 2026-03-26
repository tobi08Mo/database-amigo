import { Link } from "react-router-dom";
import { getCurrentUser, logout, getMessages, isCurrentUserAdmin } from "@/lib/store";
import { useNavigate } from "react-router-dom";

export default function RetroHeader() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const unread = user ? getMessages().filter(m => m.to === user.username && !m.read).length : 0;
  const isAdmin = isCurrentUserAdmin();

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
      <div className="bm-topbar-nav">
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
  );
}
