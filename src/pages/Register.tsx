import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== password2) { setError("Passwörter stimmen nicht überein."); return; }
    if (username.length < 3) { setError("Benutzername muss mindestens 3 Zeichen haben."); return; }
    if (password.length < 6) { setError("Passwort muss mindestens 6 Zeichen haben."); return; }
    
    setLoading(true);
    const result = await register(username, password);
    setLoading(false);
    
    if (result.success) {
      navigate("/home");
    } else {
      setError(result.error || "Registrierung fehlgeschlagen.");
    }
  };

  return (
    <div className="bm-bg">
      <div className="bm-topbar">
        <div className="bm-topbar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/images/logo.png" alt="Basta Market" />
          <span>BASTA <span className="market-text">MARKET</span></span>
        </div>
        <div className="bm-globe-icon">🌐</div>
      </div>

      <div className="bm-auth-page">
        <img src="/images/logo.png" alt="Basta Market" className="bm-auth-logo" />
        <div className="bm-auth-title">
          BASTA <span className="market-text">MARKET</span>
        </div>

        <div className="bm-auth-card">
          <h2>Registrieren</h2>
          <p className="subtitle">Erstelle deinen Account</p>

          {error && (
            <div style={{ background: "hsl(0 50% 15%)", color: "hsl(0 70% 65%)", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="bm-form-group">
              <label className="bm-form-label">Benutzername</label>
              <input className="bm-form-input" placeholder="Wähle einen Benutzernamen" value={username} onChange={e => setUsername(e.target.value)} required disabled={loading} />
            </div>
            <div className="bm-form-group">
              <label className="bm-form-label">Passwort</label>
              <div className="bm-password-wrap">
                <input className="bm-form-input" type={showPw ? "text" : "password"} placeholder="Mindestens 6 Zeichen" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                <button type="button" className="bm-password-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁"}</button>
              </div>
            </div>
            <div className="bm-form-group">
              <label className="bm-form-label">Passwort bestätigen</label>
              <input className="bm-form-input" type="password" placeholder="Passwort wiederholen" value={password2} onChange={e => setPassword2(e.target.value)} required disabled={loading} />
            </div>
            <button className="bm-btn-primary" type="submit" disabled={loading}>
              {loading ? "Registrieren..." : "Registrieren"} <span>→</span>
            </button>
          </form>

          <p style={{ fontSize: 11, color: "hsl(0 0% 40%)", textAlign: "center", marginTop: 16 }}>
            Bereits einen Account? <span className="bm-link" onClick={() => navigate("/")}>Anmelden</span>
          </p>
        </div>
      </div>
    </div>
  );
}
