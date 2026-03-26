import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, seedIfEmpty } from "@/lib/store";
import { useEffect } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { seedIfEmpty(); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(username, password);
    if (user) {
      navigate("/home");
      window.location.reload();
    } else {
      alert("Ungültige Zugangsdaten. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="bm-bg">
      {/* Top bar */}
      <div className="bm-topbar">
        <div className="bm-topbar-logo">
          <img src="/images/logo.png" alt="Basta Market" />
          <span>BASTA <span className="market-text">MARKET</span></span>
        </div>
        <div className="bm-globe-icon">🌐</div>
      </div>

      {/* Auth content */}
      <div className="bm-auth-page">
        <img src="/images/logo.png" alt="Basta Market" className="bm-auth-logo" />
        <div className="bm-auth-title">
          BASTA <span className="market-text">MARKET</span>
        </div>

        {/* Info boxes */}
        <div className="bm-info-box">
          <div className="bm-info-box-label">Um einen Account zu erhalten, schreibe auf Telegram:</div>
          <a href="https://t.me/xervio" target="_blank" rel="noopener noreferrer">@xervio</a>
        </div>

        <div className="bm-info-box">
          <div className="bm-info-box-label">Tritt unserer Community bei:</div>
          <a href="#" onClick={(e) => e.preventDefault()}>Basta Market Chat →</a>
        </div>

        {/* Login form */}
        <div className="bm-auth-card">
          <h2>Anmelden</h2>
          <p className="subtitle">Gib deine Zugangsdaten ein, um fortzufahren</p>

          <form onSubmit={handleLogin}>
            <div className="bm-form-group">
              <label className="bm-form-label">Benutzername</label>
              <input
                className="bm-form-input"
                placeholder="Dein Benutzername"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="bm-form-group">
              <label className="bm-form-label">Passwort</label>
              <div className="bm-password-wrap">
                <input
                  className="bm-form-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Dein Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="bm-password-toggle"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button className="bm-btn-primary" type="submit">
              Anmelden <span>→</span>
            </button>
          </form>

          <p style={{ fontSize: 11, color: "hsl(0 0% 40%)", textAlign: "center", marginTop: 16 }}>
            Demo: darkvendor / cryptobuyer / silktrader (Passwort: pass123)
          </p>
        </div>
      </div>
    </div>
  );
}
