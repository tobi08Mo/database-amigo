import { Link } from "react-router-dom";
import { getCurrentUser, logout, getMessages } from "@/lib/store";
import { useNavigate } from "react-router-dom";

export default function RetroHeader() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const unread = user ? getMessages().filter(m => m.to === user.username && !m.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="retro-header">
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={{ width: "200px", verticalAlign: "middle" }}>
              <Link to="/" style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: "Courier New", fontSize: 20, color: "hsl(120,70%,45%)", fontWeight: "bold", letterSpacing: 3 }}>
                  ★ BASTA<span style={{ color: "hsl(45,100%,50%)" }}>MARKET</span>
                </span>
              </Link>
            </td>
            <td className="retro-nav" style={{ verticalAlign: "middle", textAlign: "center" }}>
              <Link to="/">HOME</Link>
              <Link to="/listings">LISTINGS</Link>
              <Link to="/search">SEARCH</Link>
              {user && <Link to="/create-listing">SELL</Link>}
              {user && <Link to="/dashboard">DASHBOARD</Link>}
              {user && (
                <Link to="/messages">
                  INBOX{unread > 0 && <span className="retro-blink" style={{ color: "hsl(45,100%,55%)" }}> [{unread}]</span>}
                </Link>
              )}
            </td>
            <td style={{ width: "220px", verticalAlign: "middle", textAlign: "right", fontSize: 11, fontFamily: "Verdana, sans-serif" }}>
              {user ? (
                <>
                  <Link to={`/profile/${user.username}`} className="retro-link" style={{ marginRight: 8 }}>
                    {user.username}
                  </Link>
                  <span className="text-ltc" style={{ marginRight: 8 }}>{user.ltcBalance.toFixed(4)} LTC</span>
                  <button className="retro-btn" onClick={handleLogout} style={{ fontSize: 9 }}>LOGOUT</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="retro-link" style={{ marginRight: 8 }}>LOGIN</Link>
                  <Link to="/register" className="retro-link">REGISTER</Link>
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="retro-marquee" style={{ marginTop: 4, fontSize: 10, color: "hsl(45,100%,50%)" }}>
        <span>★★★ Welcome to Basta Market — Your Trusted Pseudonymous Marketplace — LTC Only — Escrow Protected — Est. 2012 ★★★</span>
      </div>
    </div>
  );
}
