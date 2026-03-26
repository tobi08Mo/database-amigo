import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/lib/store";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) { alert("Passwörter stimmen nicht überein."); return; }
    if (username.length < 3) { alert("Benutzername muss mindestens 3 Zeichen haben."); return; }
    if (password.length < 4) { alert("Passwort muss mindestens 4 Zeichen haben."); return; }
    const user = registerUser(username, password);
    if (user) {
      alert("Registrierung erfolgreich! Deine LTC-Adresse: " + user.ltcAddress);
      navigate("/");
    } else {
      alert("Benutzername bereits vergeben.");
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

          <form onSubmit={handleRegister}>
            <div className="bm-form-group">
              <label className="bm-form-label">Benutzername</label>
              <input className="bm-form-input" placeholder="Wähle einen Benutzernamen" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="bm-form-group">
              <label className="bm-form-label">Passwort</label>
              <div className="bm-password-wrap">
                <input className="bm-form-input" type={showPw ? "text" : "password"} placeholder="Dein Passwort" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="bm-password-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁"}</button>
              </div>
            </div>
            <div className="bm-form-group">
              <label className="bm-form-label">Passwort bestätigen</label>
              <input className="bm-form-input" type="password" placeholder="Passwort wiederholen" value={password2} onChange={e => setPassword2(e.target.value)} required />
            </div>
            <button className="bm-btn-primary" type="submit">Registrieren <span>→</span></button>
          </form>

          <p style={{ fontSize: 11, color: "hsl(0 0% 40%)", textAlign: "center", marginTop: 16 }}>
            Bereits einen Account? <span className="bm-link" onClick={() => navigate("/")}>Anmelden</span>
          </p>
        </div>
      </div>
    </div>
  );
}
