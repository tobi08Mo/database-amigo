import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { registerUser } from "@/lib/store";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) { alert("ERROR: Passwords do not match."); return; }
    if (username.length < 3) { alert("ERROR: Username must be at least 3 characters."); return; }
    if (password.length < 4) { alert("ERROR: Password must be at least 4 characters."); return; }
    const user = registerUser(username, password);
    if (user) {
      alert("Registration successful! Welcome to Basta Market, " + user.username + ".\nYour LTC deposit address: " + user.ltcAddress);
      navigate("/login");
    } else {
      alert("ERROR: Username already taken.");
    }
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <div style={{ maxWidth: 420, margin: "40px auto" }}>
          <div className="retro-card" style={{ padding: 20 }}>
            <h1>📝 REGISTER</h1>
            <form onSubmit={handleRegister}>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana", width: 120 }}>Username:</td><td><input className="retro-input" value={username} onChange={e => setUsername(e.target.value)} required /></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Password:</td><td><input className="retro-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Confirm:</td><td><input className="retro-input" type="password" value={password2} onChange={e => setPassword2(e.target.value)} required /></td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button className="retro-btn" type="submit">» CREATE ACCOUNT «</button>
              </div>
            </form>
            <hr className="retro-separator" />
            <p style={{ fontSize: 10, textAlign: "center" }}>
              Already have an account? <Link to="/login" className="retro-link">Login here</Link>
            </p>
            <div className="retro-card" style={{ marginTop: 10, fontSize: 9, padding: 8 }}>
              <strong className="text-warn">⚠ NOTICE:</strong> Do not use a username or password you use elsewhere. This is a demo with localStorage storage.
            </div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
