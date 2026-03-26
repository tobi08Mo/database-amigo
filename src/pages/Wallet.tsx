import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

const LTC_EUR_RATE = 76.50;

interface InvoiceData {
  txn_id: string;
  wallet_address: string;
  amount_ltc: string;
  amount_eur: number;
  qr_code: string;
  expire_utc: string;
}

interface Transaction {
  id: string;
  type: string;
  amount_ltc: number;
  amount_eur: number | null;
  txn_id: string | null;
  status: string;
  created_at: string;
}

function getExpireTimestampMs(expireUtc: string) {
  const trimmed = String(expireUtc || "").trim();
  if (!trimmed) return 0;

  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return trimmed.length <= 10 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(trimmed).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function DepositTimer({ expireUtc, onExpired }: { expireUtc: string; onExpired: () => void }) {
  const getRemaining = () => {
    const expireTime = getExpireTimestampMs(expireUtc);
    if (!expireTime) return 0;
    return Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const expireTime = getExpireTimestampMs(expireUtc);
    if (!expireTime) { onExpired(); return; }
    if (Date.now() >= expireTime) { onExpired(); return; }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expireUtc, onExpired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 300;

  return (
    <div style={{
      fontSize: 28,
      fontWeight: "bold",
      fontFamily: "monospace",
      color: isUrgent ? "hsl(0 70% 60%)" : "hsl(0 0% 90%)",
      textAlign: "center",
      padding: "8px 0",
    }}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

export default function Wallet() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [ltcBalance, setLtcBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [depositAmountEur, setDepositAmountEur] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "deposit" | "withdraw">("overview");
  const [invoice, setInvoice] = useState<InvoiceData | null>(() => {
    try {
      const saved = localStorage.getItem("bm_active_invoice");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
       const expireTime = getExpireTimestampMs(parsed.expire_utc);
      if (expireTime > 0 && Date.now() >= expireTime) {
        localStorage.removeItem("bm_active_invoice");
        return null;
      }
      return parsed;
    } catch { return null; }
  });
  const [invoiceExpired, setInvoiceExpired] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const statusInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load balance from database
  const loadBalance = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke("wallet-db", {
        body: { action: "get_balance", username: user.username },
      });
      if (data?.success) {
        setLtcBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // Persist invoice to localStorage
  useEffect(() => {
    if (invoice && !invoiceExpired) {
      localStorage.setItem("bm_active_invoice", JSON.stringify(invoice));
    } else {
      localStorage.removeItem("bm_active_invoice");
    }
  }, [invoice, invoiceExpired]);

  const handleExpired = useCallback(() => {
    setInvoiceExpired(true);
    localStorage.removeItem("bm_active_invoice");
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }
  }, []);

  const clearInvoice = useCallback(() => {
    setInvoice(null);
    setInvoiceExpired(false);
    localStorage.removeItem("bm_active_invoice");
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }
  }, []);

  // Credit to DB and reload
  const creditAndClear = useCallback(async (ltcAmount: number, txnId: string, amountEur: number, walletAddr: string) => {
    if (ltcAmount <= 0 || !user) return;
    try {
      const { data } = await supabase.functions.invoke("wallet-db", {
        body: {
          action: "credit",
          username: user.username,
          amount_ltc: ltcAmount,
          amount_eur: amountEur,
          txn_id: txnId,
          wallet_address: walletAddr,
        },
      });
      if (data?.already_credited) {
        // Already credited, just clear invoice
        clearInvoice();
        loadBalance();
        return;
      }
      if (data?.success) {
        clearInvoice();
        setLtcBalance(data.new_balance);
        alert("✓ Zahlung empfangen! Dein Guthaben wurde aktualisiert.");
        loadBalance();
      }
    } catch (err) {
      console.error("Credit error:", err);
    }
  }, [user, clearInvoice, loadBalance]);

  const startStatusPolling = useCallback((txnId: string, amountEur: number, walletAddr: string) => {
    if (statusInterval.current) clearInterval(statusInterval.current);
    statusInterval.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("plisio-gateway", {
          body: { action: "check_status", txn_id: txnId },
        });
        const st = data?.status;
        if (st === "completed" || st === "confirmed" || st === "mismatch") {
          clearInterval(statusInterval.current!);
          statusInterval.current = null;
          const ltcAmount = parseFloat(data?.amount || "0");
          await creditAndClear(ltcAmount, txnId, amountEur, walletAddr);
        } else if (st === "expired" || st === "error" || st === "cancelled") {
          clearInterval(statusInterval.current!);
          statusInterval.current = null;
          clearInvoice();
        }
      } catch {
        // Silently retry
      }
    }, 15000);
  }, [creditAndClear, clearInvoice]);

  // Resume polling if invoice exists on mount
  useEffect(() => {
    if (invoice && !invoiceExpired) {
      setTab("deposit");
      startStatusPolling(invoice.txn_id, invoice.amount_eur, invoice.wallet_address);
    }
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) { navigate("/"); return null; }

  const balanceEur = (ltcBalance * LTC_EUR_RATE).toFixed(2);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountEur = parseFloat(depositAmountEur);
    if (!amountEur || amountEur < 1) { alert("Mindestbetrag: 1€"); return; }
    if (amountEur > 10000) { alert("Maximalbetrag: 10.000€"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plisio-gateway", {
        body: {
          action: "create_invoice",
          amount_eur: amountEur,
          username: user.username,
        },
      });
      if (error) throw error;
      if (data?.success) {
        const inv: InvoiceData = {
          txn_id: data.txn_id,
          wallet_address: data.wallet_address,
          amount_ltc: data.amount_ltc,
          amount_eur: data.amount_eur,
          qr_code: data.qr_code,
          expire_utc: data.expire_utc,
        };
        setInvoice(inv);
        setInvoiceExpired(false);
        startStatusPolling(data.txn_id, data.amount_eur, data.wallet_address);
      } else {
        alert("Fehler: " + (data?.error || "Unbekannter Fehler"));
      }
    } catch (err: any) {
      console.error("Invoice error:", err);
      alert("Fehler beim Erstellen der Rechnung.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!invoice) return;
    setCheckingStatus(true);
    try {
      const { data } = await supabase.functions.invoke("plisio-gateway", {
        body: { action: "check_status", txn_id: invoice.txn_id },
      });
      const st = data?.status;
      if (st === "completed" || st === "confirmed" || st === "mismatch") {
        const ltcAmount = parseFloat(data?.amount || invoice.amount_ltc || "0");
        await creditAndClear(ltcAmount, invoice.txn_id, invoice.amount_eur, invoice.wallet_address);
      } else if (st === "expired" || st === "error" || st === "cancelled") {
        clearInvoice();
        alert("Zahlung abgelaufen oder fehlgeschlagen.");
      } else {
        const statusMap: Record<string, string> = {
          new: "Warte auf Zahlung",
          pending: "Zahlung erkannt, warte auf Bestätigung",
          confirming: "Wird bestätigt...",
        };
        alert(statusMap[st] || ("Status: " + st + " — Noch nicht bestätigt."));
      }
    } catch {
      alert("Fehler beim Prüfen des Status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { alert("Ungültiger Betrag."); return; }
    if (amount > ltcBalance) { alert("Nicht genügend Guthaben. Verfügbar: " + ltcBalance.toFixed(4) + " LTC"); return; }
    if (!withdrawAddress.trim() || withdrawAddress.length < 10) { alert("Bitte gültige LTC-Adresse eingeben."); return; }
    setLoading(true);
    try {
      // First debit from DB
      const { data: debitData, error: debitError } = await supabase.functions.invoke("wallet-db", {
        body: {
          action: "debit",
          username: user.username,
          amount_ltc: amount,
          amount_eur: amount * LTC_EUR_RATE,
          type: "withdrawal",
        },
      });
      if (debitError) throw debitError;
      if (!debitData?.success) {
        alert("Fehler: " + (debitData?.error || "Auszahlung fehlgeschlagen"));
        return;
      }

      // Then send via Plisio
      const { data, error } = await supabase.functions.invoke("plisio-gateway", {
        body: {
          action: "withdraw",
          amount: amount,
          address: withdrawAddress.trim(),
          username: user.username,
        },
      });
      if (error || !data?.success) {
        // Refund if Plisio fails
        await supabase.functions.invoke("wallet-db", {
          body: {
            action: "credit",
            username: user.username,
            amount_ltc: amount,
            amount_eur: amount * LTC_EUR_RATE,
          },
        });
        alert("Fehler: " + (data?.error || "Auszahlung fehlgeschlagen"));
      } else {
        alert("✓ Auszahlung von " + amount + " LTC wurde gesendet!");
        loadBalance();
      }
    } catch (err: any) {
      console.error("Withdraw error:", err);
      alert("Fehler bei der Auszahlung.");
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
          {loadingBalance ? (
            <div className="bm-dim">Laden...</div>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "hsl(0 0% 90%)" }}>
                {balanceEur}€
                <span className="bm-ltc" style={{ fontSize: 14, fontWeight: 400, marginLeft: 10 }}>
                  ({ltcBalance.toFixed(4)} LTC)
                </span>
              </div>
              <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
                1 LTC ≈ {LTC_EUR_RATE.toFixed(2)}€
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          <span className={tabClass("overview")} onClick={() => setTab("overview")} style={{ cursor: "pointer" }}>Übersicht</span>
          <span className={tabClass("deposit")} onClick={() => setTab("deposit")} style={{ cursor: "pointer" }}>Einzahlen</span>
          <span className={tabClass("withdraw")} onClick={() => setTab("withdraw")} style={{ cursor: "pointer" }}>Auszahlen</span>
        </div>

        <div className="bm-card" style={{ padding: 16 }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <>
              <h3>Wallet Übersicht</h3>
              <table className="bm-table">
                <thead><tr><th>Detail</th><th>Wert</th></tr></thead>
                <tbody>
                  <tr><td>Guthaben (LTC)</td><td className="bm-ltc" style={{ fontWeight: "bold" }}>{ltcBalance.toFixed(4)} LTC</td></tr>
                  <tr><td>Guthaben (EUR)</td><td style={{ fontWeight: "bold" }}>{balanceEur}€</td></tr>
                  <tr><td>Zahlungsmethode</td><td>Plisio (LTC)</td></tr>
                </tbody>
              </table>

              {/* Transaction History */}
              <h3 style={{ marginTop: 16 }}>Transaktionen</h3>
              {transactions.length === 0 ? (
                <div className="bm-dim" style={{ fontSize: 12, padding: 10 }}>Keine Transaktionen vorhanden.</div>
              ) : (
                <table className="bm-table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr><th>Datum</th><th>Typ</th><th>Betrag</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleDateString("de-DE")}</td>
                        <td>{tx.type === "deposit" ? "Einzahlung" : tx.type === "withdrawal" ? "Auszahlung" : tx.type === "purchase" ? "Kauf" : "Verkauf"}</td>
                        <td className="bm-ltc" style={{ fontWeight: "bold" }}>
                          {tx.type === "deposit" || tx.type === "sale" ? "+" : "-"}{tx.amount_ltc.toFixed(4)} LTC
                          {tx.amount_eur && <span className="bm-dim" style={{ marginLeft: 4 }}>({Number(tx.amount_eur).toFixed(2)}€)</span>}
                        </td>
                        <td>{tx.status === "completed" ? "✓" : tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* DEPOSIT — form */}
          {tab === "deposit" && !invoice && (
            <>
              <h3>Guthaben aufladen</h3>
              <p className="bm-dim" style={{ fontSize: 12, marginBottom: 12 }}>
                Gib den Betrag in Euro ein. Du erhältst eine LTC-Adresse und einen QR-Code zum Bezahlen.
              </p>
              <form onSubmit={handleCreateInvoice}>
                <div className="bm-form-group">
                  <label className="bm-form-label">Betrag in Euro (€)</label>
                  <input
                    className="bm-form-input"
                    type="number"
                    step="0.01"
                    min="1"
                    max="10000"
                    placeholder="z.B. 50"
                    value={depositAmountEur}
                    onChange={e => setDepositAmountEur(e.target.value)}
                    required
                  />
                  {depositAmountEur && parseFloat(depositAmountEur) > 0 && (
                    <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
                      ≈ {(parseFloat(depositAmountEur) / LTC_EUR_RATE).toFixed(4)} LTC
                    </div>
                  )}
                </div>
                <button className="bm-btn-primary" type="submit" disabled={loading} style={{ width: "auto", padding: "8px 24px" }}>
                  {loading ? "Wird erstellt..." : "Einzahlung erstellen →"}
                </button>
              </form>
            </>
          )}

          {/* DEPOSIT — INVOICE ACTIVE */}
          {tab === "deposit" && invoice && !invoiceExpired && (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ marginBottom: 4 }}>Zahlung ausstehend</h3>
              <div className="bm-dim" style={{ fontSize: 11, marginBottom: 14 }}>
                Sende exakt den angegebenen LTC-Betrag an die Adresse unten.
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="bm-dim" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Verbleibende Zeit</div>
                <DepositTimer expireUtc={invoice.expire_utc} onExpired={handleExpired} />
              </div>

              {invoice.qr_code && (
                <div style={{ marginBottom: 14 }}>
                  <img
                    src={invoice.qr_code}
                    alt="QR Code"
                    style={{ width: 180, height: 180, imageRendering: "pixelated", border: "4px solid hsl(0 0% 90%)", background: "white", padding: 8 }}
                  />
                </div>
              )}

              <div className="bm-card" style={{ padding: 12, marginBottom: 8, textAlign: "left" }}>
                <div className="bm-dim" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Zu zahlender Betrag</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="bm-ltc" style={{ fontSize: 18, fontWeight: "bold", fontFamily: "monospace" }}>
                    {invoice.amount_ltc} LTC
                  </span>
                  <button
                    className="bm-btn-secondary"
                    onClick={() => copyToClipboard(invoice.amount_ltc, "amount")}
                    style={{ fontSize: 10, padding: "4px 10px" }}
                  >
                    {copied === "amount" ? "✓ Kopiert" : "Kopieren"}
                  </button>
                </div>
                <div className="bm-dim" style={{ fontSize: 10, marginTop: 2 }}>= {invoice.amount_eur.toFixed(2)}€</div>
              </div>

              <div className="bm-card" style={{ padding: 12, marginBottom: 12, textAlign: "left" }}>
                <div className="bm-dim" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>LTC Einzahlungsadresse</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "hsl(0 0% 80%)" }}>
                    {invoice.wallet_address}
                  </span>
                  <button
                    className="bm-btn-secondary"
                    onClick={() => copyToClipboard(invoice.wallet_address, "address")}
                    style={{ fontSize: 10, padding: "4px 10px", flexShrink: 0 }}
                  >
                    {copied === "address" ? "✓ Kopiert" : "Kopieren"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="bm-btn-accent" onClick={handleCheckStatus} disabled={checkingStatus} style={{ fontSize: 11 }}>
                  {checkingStatus ? "Prüfe..." : "Status prüfen"}
                </button>
                <button className="bm-btn-secondary" onClick={clearInvoice} style={{ fontSize: 11 }}>
                  Abbrechen
                </button>
              </div>

              <div className="bm-dim" style={{ fontSize: 9, marginTop: 12, lineHeight: 1.6 }}>
                ⚠ Sende exakt den angegebenen Betrag. Abweichende Beträge können zu Verzögerungen führen.<br />
                Die Zahlung wird automatisch erkannt. Du kannst den Status auch manuell prüfen.
              </div>
            </div>
          )}

          {/* DEPOSIT — EXPIRED */}
          {tab === "deposit" && invoice && invoiceExpired && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⏰</div>
              <h3>Zahlung abgelaufen</h3>
              <p className="bm-dim" style={{ fontSize: 12, marginBottom: 14 }}>
                Die Zahlungsfrist ist abgelaufen. Bitte erstelle eine neue Einzahlung.
              </p>
              <button className="bm-btn-primary" onClick={clearInvoice} style={{ width: "auto", padding: "8px 24px" }}>
                Neue Einzahlung →
              </button>
            </div>
          )}

          {/* WITHDRAW */}
          {tab === "withdraw" && (
            <>
              <h3>LTC Auszahlen</h3>
              <p className="bm-dim" style={{ fontSize: 12, marginBottom: 12 }}>
                Gib den Betrag in LTC und deine Empfangsadresse ein.
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
                      ≈ {(parseFloat(withdrawAmount) * LTC_EUR_RATE).toFixed(2)}€ | Verfügbar: {ltcBalance.toFixed(4)} LTC
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
