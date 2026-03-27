import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, isCurrentUserAdmin } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V13h6v8" />
  </svg>
);

const IconListings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="0" />
    <rect x="14" y="3" width="7" height="7" rx="0" />
    <rect x="3" y="14" width="7" height="7" rx="0" />
    <rect x="14" y="14" width="7" height="7" rx="0" />
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="0" />
    <path d="M2 6l0-1a2 2 0 012-2h12a2 2 0 012 2v1" />
    <circle cx="17" cy="13" r="1.5" />
  </svg>
);

const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21c0-3.87-3.58-7-8-7s-8 3.13-8 7" />
  </svg>
);

const IconMessages = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export default function RetroHeader() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = isCurrentUserAdmin();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.username) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("to_user", user.username)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel(`header-unread-${user.username}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.username]);

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
          <Link to="/messages" style={{ position: "relative" }}>
            Nachrichten
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -14,
                background: "hsl(0 70% 50%)", color: "#fff",
                fontSize: 9, fontWeight: 700, borderRadius: "50%",
                width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</span>
            )}
          </Link>
          <Link to="/wallet">Wallet</Link>
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
        <Link to="/wallet" className={`bm-bottom-nav-item ${isActive("/wallet") ? "active" : ""}`}>
          <IconWallet />
          <span>Wallet</span>
        </Link>
        <Link to="/messages" className={`bm-bottom-nav-item ${isActive("/messages") ? "active" : ""}`} style={{ position: "relative" }}>
          <IconMessages />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 2, right: "50%", marginRight: -18,
              background: "hsl(0 70% 50%)", borderRadius: "50%",
              width: 8, height: 8, display: "block",
            }} />
          )}
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
