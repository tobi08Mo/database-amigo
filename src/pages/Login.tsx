import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) { navigate("/home", { replace: true }); return null; }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate("/home");
    } else {
      setError("Ungültige Zugangsdaten. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="bm-bg">
      <div className="bm-topbar">
        <div className="bm-topbar-logo">
          <img src="/images/logo.png" alt="Basta Market" />
          <span>BASTA <span className="market-text">MARKET</span></span>
        </div>
        <div className="bm-globe-icon">🌐</div>
      </div>

      <div className="bm-auth-page">
        <img src="/images/logo.png" alt="Basta Market" className="bm-auth-logo" />
        <div className="bm-auth-title" style={{ fontSize: "3rem", letterSpacing: "0.15em" }}>
          BASTA <span className="market-text">MARKET</span>
        </div>

        <div className="bm-info-box">
          <div className="bm-info-box-label">Um einen Account zu erhalten, schreibe auf Telegram:</div>
          <a href="https://t.me/xervio" target="_blank" rel="noopener noreferrer">@xervio</a>
        </div>

        <div className="bm-info-box">
          <div className="bm-info-box-label">Tritt unserer Community bei:</div>
          <a href="#" onClick={(e) => e.preventDefault()}>Basta Market Chat →</a>
        </div>

        <div className="bm-auth-card">
          <h2>Anmelden</h2>
          <p className="subtitle">Gib deine Zugangsdaten ein, um fortzufahren</p>

          {error && (
            <div style={{ background: "hsl(0 50% 15%)", color: "hsl(0 70% 65%)", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="bm-form-group">
              <label className="bm-form-label">Benutzername</label>
              <input
                className="bm-form-input"
                placeholder="Dein Benutzername"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
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
                  disabled={loading}
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

            <button className="bm-btn-primary" type="submit" disabled={loading}>
              {loading ? "Anmelden..." : "Anmelden"} <span>→</span>
            </button>
          </form>

          <p style={{ fontSize: 12, color: "hsl(0 0% 50%)", textAlign: "center", marginTop: 18 }}>
            Noch keinen Account? <span className="bm-link" onClick={() => navigate("/register")} style={{ cursor: "pointer" }}>Jetzt registrieren</span>
          </p>
        </div>
      </div>
    </div>
  );
}
