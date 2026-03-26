import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, updateUser } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

const LTC_EUR_RATE = 76.50; // Demo rate

export default function Wallet() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');

  if (!user) { navigate("/"); return null; }

  const balanceEur = (user.ltcBalance * LTC_EUR_RATE).toFixed(2);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { alert("Ungültiger Betrag."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plisio-gateway", {
        body: {
          action: "create_invoice",
          amount: amount,
          currency: "LTC",
          order_name: `Deposit ${amount} LTC - ${user.username}`,
          order_number: `DEP-${user.username}-${Date.now()}`,
        },
      });
      if (error) throw error;
      if (data?.invoice_url) {
        window.open(data.invoice_url, "_blank");
        alert("✓ Zahlungsseite wurde geöffnet. Nach Bestätigung wird dein Guthaben aktualisiert.");
      } else if (data?.error) {
        alert("Fehler: " + data.error);
      }
    } catch (err: any) {
      console.error("Deposit error:", err);
      // Demo fallback
      updateUser(user.username, { ltcBalance: user.ltcBalance + amount });
      alert("✓ " + amount + " LTC eingezahlt (Demo-Modus)");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { alert("Ungültiger Betrag."); return; }
    if (amount > user.ltcBalance) { alert("Nicht genügend Guthaben."); return; }
    if (!withdrawAddress.trim()) { alert("Bitte LTC-Adresse eingeben."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plisio-gateway", {
        body: {
          action: "withdraw",
          amount: amount,
          currency: "LTC",
          address: withdrawAddress,
          order_number: `WD-${user.username}-${Date.now()}`,
        },
      });
      if (error) throw error;
      if (data?.success) {
        updateUser(user.username, { ltcBalance: user.ltcBalance - amount });
        alert("✓ Auszahlung von " + amount + " LTC gesendet!");
        window.location.reload();
      } else if (data?.error) {
        alert("Fehler: " + data.error);
      }
    } catch (err: any) {
      console.error("Withdraw error:", err);
      // Demo fallback
      updateUser(user.username, { ltcBalance: user.ltcBalance - amount });
      alert("✓ " + amount + " LTC ausgezahlt (Demo-Modus)");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (t: string) => t === tab ? "bm-tab bm-tab-active" : "bm-tab bm-tab-inactive";

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Wallet</h1>

        {/* Balance card */}
        <div className="bm-card" style={{ padding: 16, marginBottom: 14 }}>
          <div className="bm-dim" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Dein Guthaben</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "hsl(0 0% 90%)" }}>
            {balanceEur}€
            <span className="bm-ltc" style={{ fontSize: 14, fontWeight: 400, marginLeft: 10 }}>
              ({user.ltcBalance.toFixed(4)} LTC)
            </span>
          </div>
          <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
            1 LTC ≈ {LTC_EUR_RATE.toFixed(2)}€ (Kurs kann variieren)
          </div>
          <div style={{ marginTop: 10, fontSize: 11 }}>
            <span className="bm-dim">Einzahlungsadresse:</span>
            <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "hsl(0 0% 70%)", marginTop: 2 }}>
              {user.ltcAddress}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          <span className={tabClass('overview')} onClick={() => setTab('overview')} style={{ cursor: "pointer" }}>Übersicht</span>
          <span className={tabClass('deposit')} onClick={() => setTab('deposit')} style={{ cursor: "pointer" }}>Einzahlen</span>
          <span className={tabClass('withdraw')} onClick={() => setTab('withdraw')} style={{ cursor: "pointer" }}>Auszahlen</span>
        </div>

        <div className="bm-card" style={{ borderTopLeftRadius: 0, padding: 16 }}>
          {tab === 'overview' && (
            <>
              <h3>Wallet Übersicht</h3>
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>Detail</th>
                    <th>Wert</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Guthaben (LTC)</td><td className="bm-ltc" style={{ fontWeight: "bold" }}>{user.ltcBalance.toFixed(4)} LTC</td></tr>
                  <tr><td>Guthaben (EUR)</td><td style={{ fontWeight: "bold" }}>{balanceEur}€</td></tr>
                  <tr><td>Einzahlungsadresse</td><td style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>{user.ltcAddress}</td></tr>
                  <tr><td>Verkäufe gesamt</td><td>{user.totalSales}</td></tr>
                  <tr><td>Zahlungsmethode</td><td>Plisio (LTC)</td></tr>
                </tbody>
              </table>
              <div className="bm-dim" style={{ fontSize: 10, marginTop: 10 }}>
                Alle Transaktionen werden über Plisio abgewickelt. Einzahlungen und Auszahlungen erfolgen in Litecoin (LTC).
              </div>
            </>
          )}

          {tab === 'deposit' && (
            <>
              <h3>LTC Einzahlen</h3>
              <p className="bm-dim" style={{ fontSize: 12, marginBottom: 12 }}>
                Gib den Betrag ein, den du einzahlen möchtest. Du wirst zu Plisio weitergeleitet.
              </p>
              <form onSubmit={handleDeposit}>
                <div className="bm-form-group">
                  <label className="bm-form-label">Betrag (LTC)</label>
                  <input
                    className="bm-form-input"
                    type="number"
                    step="0.0001"
                    min="0.001"
                    placeholder="z.B. 0.5"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    required
                  />
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
                      ≈ {(parseFloat(depositAmount) * LTC_EUR_RATE).toFixed(2)}€
                    </div>
                  )}
                </div>
                <button className="bm-btn-primary" type="submit" disabled={loading} style={{ width: "auto", padding: "8px 24px" }}>
                  {loading ? "Wird verarbeitet..." : "Einzahlen via Plisio →"}
                </button>
              </form>
            </>
          )}

          {tab === 'withdraw' && (
            <>
              <h3>LTC Auszahlen</h3>
              <p className="bm-dim" style={{ fontSize: 12, marginBottom: 12 }}>
                Gib den Betrag und deine LTC-Adresse ein. Die Auszahlung wird über Plisio verarbeitet.
              </p>
              <form onSubmit={handleWithdraw}>
                <div className="bm-form-group">
                  <label className="bm-form-label">Betrag (LTC)</label>
                  <input
                    className="bm-form-input"
                    type="number"
                    step="0.0001"
                    min="0.001"
                    placeholder="z.B. 0.1"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    required
                  />
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
                      ≈ {(parseFloat(withdrawAmount) * LTC_EUR_RATE).toFixed(2)}€ | Verfügbar: {user.ltcBalance.toFixed(4)} LTC
                    </div>
                  )}
                </div>
                <div className="bm-form-group">
                  <label className="bm-form-label">LTC Empfangsadresse</label>
                  <input
                    className="bm-form-input"
                    type="text"
                    placeholder="L... oder ltc1..."
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    required
                  />
                </div>
                <button className="bm-btn-primary" type="submit" disabled={loading} style={{ width: "auto", padding: "8px 24px" }}>
                  {loading ? "Wird verarbeitet..." : "Auszahlen →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
