import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useLtcEurRate } from "@/hooks/useLtcEurRate";
import OrderDelivery from "@/components/OrderDelivery";
import DisputeChat from "@/components/DisputeChat";

interface DBOrder {
  id: string;
  listing_id: string;
  buyer: string;
  seller: string;
  product_title: string;
  price_eur: number;
  price_ltc: number;
  status: string;
  created_at: string;
}

interface DBListing {
  id: string;
  title: string;
  price_eur: number;
  price_ltc: number;
  category: string;
  active: boolean;
}

export default function Dashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { rate } = useLtcEurRate();
  const [tab, setTab] = useState<'overview' | 'orders' | 'listings'>('overview');
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [listings, setListings] = useState<DBListing[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<Record<string, any>>({});
  const [disputeReason, setDisputeReason] = useState("");
  const username = user?.username;

  useEffect(() => {
    if (!username) return;
    loadData();

    // Realtime subscription for new orders
    const channel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username]);

  if (!user) { navigate("/"); return null; }

  const loadData = async () => {
    if (!username) return;
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .or(`buyer.eq.${username},seller.eq.${username}`)
      .order("created_at", { ascending: false });
    setOrders((orderData as DBOrder[]) || []);

    const { data: listingData } = await supabase
      .from("listings")
      .select("id, title, price_eur, price_ltc, category, active")
      .eq("seller", username);
    setListings((listingData as DBListing[]) || []);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("ltc_balance")
      .eq("username", username)
      .single();
    setWalletBalance(wallet?.ltc_balance || 0);

    // Load disputes for user's orders
    const { data: disputeData } = await supabase
      .from("disputes")
      .select("*")
      .or(`buyer.eq.${username},seller.eq.${username}`);
    if (disputeData) {
      const map: Record<string, any> = {};
      disputeData.forEach((d: any) => { map[d.order_id] = d; });
      setDisputes(map);
    }
  };

  const buyOrders = orders.filter(o => o.buyer === user.username);
  const sellOrders = orders.filter(o => o.seller === user.username);
  const pendingSellOrders = sellOrders.filter(o => o.status === 'escrow' || o.status === 'delivered');

  const handleConfirm = async (orderId: string) => {
    if (!confirm("Empfang bestätigen? Guthaben wird an Verkäufer freigegeben.")) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
    await supabase.functions.invoke("wallet-db", {
      body: { action: "credit", username: order.seller, amount_ltc: order.price_ltc, txn_id: `order_${orderId}` },
    });
    alert("✓ Abgeschlossen! Guthaben an Verkäufer freigegeben.");
    loadData();
  };

  const handleDeliver = async (orderId: string) => {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    alert("✓ Als geliefert markiert.");
    loadData();
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Listing löschen?")) return;
    await supabase.from("listings").update({ active: false }).eq("id", id);
    loadData();
  };

  const tabClass = (t: string) => t === tab ? "bm-tab bm-tab-active" : "bm-tab bm-tab-inactive";

  const statusLabel = (s: string) => {
    switch (s) {
      case 'escrow': return { text: 'ESCROW', color: 'hsl(48 100% 50%)' };
      case 'delivered': return { text: 'GELIEFERT', color: 'hsl(200 70% 55%)' };
      case 'completed': return { text: 'ABGESCHLOSSEN', color: 'hsl(120 60% 45%)' };
      default: return { text: s.toUpperCase(), color: 'hsl(0 0% 60%)' };
    }
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Dashboard — {user.username}</h1>

        {/* Alert banner for pending sell orders */}
        {pendingSellOrders.length > 0 && (
          <div
            onClick={() => setTab('orders')}
            style={{
              background: "hsl(48 80% 15%)",
              border: "1px solid hsl(48 80% 35%)",
              padding: "10px 14px",
              marginBottom: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🔔</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(48 100% 65%)" }}>
                {pendingSellOrders.length} offene Bestellung{pendingSellOrders.length > 1 ? 'en' : ''} warten auf Lieferung!
              </div>
              <div className="bm-dim" style={{ fontSize: 11 }}>
                Klicke hier um die Bestellungen zu öffnen und digitale Inhalte zu liefern.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          {(['overview', 'orders', 'listings'] as const).map(t => (
            <span key={t} className={tabClass(t)} onClick={() => setTab(t)} style={{ cursor: "pointer", position: "relative" }}>
              {t === 'overview' ? 'Übersicht' : t === 'orders' ? 'Bestellungen' : 'Meine Listings'}
              {t === 'orders' && pendingSellOrders.length > 0 && (
                <span style={{
                  background: "hsl(0 70% 50%)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 6,
                }}>
                  {pendingSellOrders.length}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="bm-card" style={{ borderTopLeftRadius: 0, padding: 16 }}>
          {tab === 'overview' && (
            <>
              <div className="bm-dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "LTC Guthaben", value: walletBalance.toFixed(4), cls: "bm-ltc" },
                  { label: "≈ EUR", value: `${(walletBalance * rate).toFixed(2)} €` },
                  { label: "Verkäufe", value: sellOrders.filter(o => o.status === 'completed').length },
                  { label: "Aktive Listings", value: listings.filter(l => l.active).length },
                ].map((s, i) => (
                  <div key={i} className="bm-card" style={{ textAlign: "center", padding: 12 }}>
                    <div className="bm-dim" style={{ fontSize: 10 }}>{s.label}</div>
                    <div className={s.cls || ""} style={{ fontSize: 18, fontWeight: "bold" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Pending orders quick view */}
              {pendingSellOrders.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ color: "hsl(48 100% 60%)" }}>⚡ Offene Bestellungen — Aktion erforderlich</h3>
                  {pendingSellOrders.map(o => (
                    <div key={o.id} className="bm-card" style={{ padding: 12, marginBottom: 8, borderLeft: "3px solid hsl(48 80% 50%)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{o.product_title}</div>
                          <div className="bm-dim" style={{ fontSize: 11 }}>
                            Käufer: {o.buyer} · {o.price_eur.toFixed(2)} € · 
                            <span style={{ color: statusLabel(o.status).color, fontWeight: 600, marginLeft: 4 }}>
                              {statusLabel(o.status).text}
                            </span>
                          </div>
                        </div>
                        <button
                          className="bm-btn-primary"
                          onClick={() => { setTab('orders'); setExpandedOrder(o.id); }}
                          style={{ fontSize: 11, padding: "6px 14px", animation: "pulse 2s infinite" }}
                        >
                          📦 Jetzt liefern
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3>Letzte Transaktionen</h3>
              <table className="bm-table">
                <thead><tr><th>ID</th><th>Artikel</th><th>Typ</th><th>Betrag</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.slice(0, 10).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontSize: 10, fontFamily: "monospace" }}>{o.id.substring(0, 8)}</td>
                      <td>{o.product_title}</td>
                      <td>{o.buyer === user.username ? <span className="bm-warn">KAUF</span> : <span style={{ color: "hsl(120 60% 55%)" }}>VERKAUF</span>}</td>
                      <td style={{ color: "hsl(48 100% 60%)" }}>{o.price_eur.toFixed(2)} €</td>
                      <td><span className="bm-badge" style={{ color: statusLabel(o.status).color }}>{statusLabel(o.status).text}</span></td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>Keine Transaktionen.</td></tr>}
                </tbody>
              </table>
            </>
          )}

          {tab === 'orders' && (
            <>
              {/* Seller orders first if there are pending ones */}
              {sellOrders.length > 0 && (
                <>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    Meine Verkäufe
                    {pendingSellOrders.length > 0 && (
                      <span style={{
                        background: "hsl(0 70% 50%)",
                        color: "white",
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>
                        {pendingSellOrders.length} offen
                      </span>
                    )}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {sellOrders.map(o => (
                      <div key={o.id} className="bm-card" style={{
                        padding: 12,
                        borderLeft: (o.status === 'escrow' || o.status === 'delivered') ? "3px solid hsl(48 80% 50%)" : "3px solid hsl(0 0% 25%)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {o.product_title}
                              {o.status === 'escrow' && (
                                <span style={{ color: "hsl(48 100% 60%)", fontSize: 11, marginLeft: 8 }}>⚠️ Warte auf Lieferung</span>
                              )}
                            </div>
                            <div className="bm-dim" style={{ fontSize: 11 }}>
                              Käufer: {o.buyer} · {o.price_eur.toFixed(2)} € · 
                              <span style={{ color: statusLabel(o.status).color, fontWeight: 600, marginLeft: 4 }}>
                                {statusLabel(o.status).text}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className={o.status === 'escrow' ? "bm-btn-primary" : "bm-btn-secondary"}
                              onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                              style={{ fontSize: 11 }}
                            >
                              {expandedOrder === o.id ? "Schließen" : "📦 Lieferung öffnen"}
                            </button>
                            {o.status === 'escrow' && (
                              <button className="bm-btn-accent" onClick={() => handleDeliver(o.id)} style={{ fontSize: 11 }}>Als geliefert</button>
                            )}
                          </div>
                        </div>
                        {expandedOrder === o.id && (
                          <OrderDelivery orderId={o.id} currentUser={user.username} seller={o.seller} buyer={o.buyer} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h2>Meine Käufe</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {buyOrders.length === 0 && <p className="bm-dim" style={{ textAlign: "center" }}>Keine Käufe.</p>}
                {buyOrders.map(o => (
                  <div key={o.id} className="bm-card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{o.product_title}</div>
                        <div className="bm-dim" style={{ fontSize: 11 }}>
                          Verkäufer: <Link to={`/profile/${o.seller}`} className="bm-link">{o.seller}</Link> · {o.price_eur.toFixed(2)} € · 
                          <span style={{ color: statusLabel(o.status).color, fontWeight: 600, marginLeft: 4 }}>
                            {statusLabel(o.status).text}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="bm-btn-secondary" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} style={{ fontSize: 11 }}>
                          {expandedOrder === o.id ? "Schließen" : "📦 Lieferung"}
                        </button>
                        {(o.status === 'escrow' || o.status === 'delivered') && (
                          <button className="bm-btn-primary" onClick={() => handleConfirm(o.id)} style={{ fontSize: 11 }}>✓ Empfangen</button>
                        )}
                      </div>
                    </div>
                    {expandedOrder === o.id && (
                      <OrderDelivery orderId={o.id} currentUser={user.username} seller={o.seller} buyer={o.buyer} />
                    )}
                  </div>
                ))}
              </div>

              {sellOrders.length === 0 && (
                <>
                  <h2 style={{ marginTop: 16 }}>Meine Verkäufe</h2>
                  <p className="bm-dim" style={{ textAlign: "center" }}>Keine Verkäufe.</p>
                </>
              )}
            </>
          )}

          {tab === 'listings' && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>Meine Listings</h2>
                <Link to="/create-listing"><button className="bm-btn-accent">+ Neues Listing</button></Link>
              </div>
              <table className="bm-table">
                <thead><tr><th>Titel</th><th>Preis</th><th>Kategorie</th><th>Status</th><th>Aktion</th></tr></thead>
                <tbody>
                  {listings.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>Keine Listings.</td></tr>}
                  {listings.map(p => (
                    <tr key={p.id}>
                      <td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link></td>
                      <td style={{ color: "hsl(48 100% 60%)" }}>{p.price_eur.toFixed(2)} €</td>
                      <td><span className="bm-badge">{p.category}</span></td>
                      <td><span className="bm-badge">{p.active ? "AKTIV" : "INAKTIV"}</span></td>
                      <td>
                        {p.active && <button className="bm-btn-danger" onClick={() => handleDeleteListing(p.id)} style={{ fontSize: 10 }}>Löschen</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
