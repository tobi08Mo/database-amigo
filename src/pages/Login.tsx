import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { loginUser } from "@/lib/store";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(username, password);
    if (user) {
      alert("Login successful! Welcome back, " + user.username);
      navigate("/dashboard");
      window.location.reload();
    } else {
      alert("ERROR: Invalid username or password.");
    }
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <div style={{ maxWidth: 400, margin: "40px auto" }}>
          <div className="retro-card" style={{ padding: 20 }}>
            <h1>🔒 LOGIN</h1>
            <form onSubmit={handleLogin}>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Username:</td>
                    <td><input className="retro-input" value={username} onChange={e => setUsername(e.target.value)} required /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Password:</td>
                    <td><input className="retro-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button className="retro-btn" type="submit">» LOGIN «</button>
              </div>
            </form>
            <hr className="retro-separator" />
            <p style={{ fontSize: 10, textAlign: "center" }}>
              No account? <Link to="/register" className="retro-link">Register here</Link>
            </p>
            <p className="text-dim" style={{ fontSize: 9, textAlign: "center", marginTop: 6 }}>
              Demo accounts: darkvendor / cryptobuyer / silktrader (password: pass123)
            </p>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
