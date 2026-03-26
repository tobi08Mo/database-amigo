import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, getOrders, getProducts, updateOrderStatus, updateUser, deleteProduct, createReview, getReviews } from "@/lib/store";

export default function Dashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview'|'orders'|'listings'|'wallet'>('overview');

  if (!user) { navigate("/"); return null; }

  const allOrders = getOrders();
  const buyOrders = allOrders.filter(o => o.buyer === user.username);
  const sellOrders = allOrders.filter(o => o.seller === user.username);
  const myProducts = getProducts().filter(p => p.seller === user.username);

  const handleDeposit = () => {
    const amt = prompt("LTC Betrag zum Einzahlen (Demo):");
    if (amt && !isNaN(parseFloat(amt)) && parseFloat(amt) > 0) {
      updateUser(user.username, { ltcBalance: user.ltcBalance + parseFloat(amt) });
      alert("✓ " + amt + " LTC eingezahlt (Demo)");
      window.location.reload();
    }
  };
  const handleConfirm = (orderId: string) => {
    if (!confirm("Empfang bestätigen? Guthaben wird an Verkäufer freigegeben.")) return;
    updateOrderStatus(orderId, 'completed');
    const r = parseInt(prompt("Bewertung (1-5):") || "5");
    const text = prompt("Feedback:") || "Gute Transaktion.";
    const order = allOrders.find(o => o.id === orderId);
    if (order) createReview(orderId, user.username, order.seller, Math.min(5, Math.max(1, r || 5)), text);
    alert("✓ Abgeschlossen!"); window.location.reload();
  };
  const handleShip = (id: string) => { updateOrderStatus(id, 'shipped'); alert("✓ Als versendet markiert."); window.location.reload(); };
  const handleDelete = (id: string) => { if (confirm("Listing löschen?")) { deleteProduct(id); window.location.reload(); } };

  const tabClass = (t: string) => t === tab ? "bm-tab bm-tab-active" : "bm-tab bm-tab-inactive";

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Dashboard — {user.username}</h1>
        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          {(['overview','orders','listings','wallet'] as const).map(t => (
            <span key={t} className={tabClass(t)} onClick={() => setTab(t)} style={{ cursor: "pointer" }}>
              {t === 'overview' ? 'Übersicht' : t === 'orders' ? 'Bestellungen' : t === 'listings' ? 'Meine Listings' : 'Wallet'}
            </span>
          ))}
        </div>
        <div className="bm-card" style={{ borderTopLeftRadius: 0, padding: 16 }}>
          {tab === 'overview' && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "LTC Guthaben", value: user.ltcBalance.toFixed(4), cls: "bm-ltc" },
                  { label: "Verkäufe", value: user.totalSales },
                  { label: "Listings", value: myProducts.filter(p => p.active).length },
                  { label: "Offene Orders", value: buyOrders.filter(o => o.status !== 'completed').length + sellOrders.filter(o => o.status !== 'completed').length },
                ].map((s, i) => (
                  <div key={i} className="bm-card" style={{ textAlign: "center", padding: 12 }}>
                    <div className="bm-dim" style={{ fontSize: 10 }}>{s.label}</div>
                    <div className={s.cls || ""} style={{ fontSize: 18, fontWeight: "bold" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <h3>Letzte Transaktionen</h3>
              <table className="bm-table">
                <thead><tr><th>ID</th><th>Artikel</th><th>Typ</th><th>Betrag</th><th>Status</th></tr></thead>
                <tbody>
                  {[...buyOrders,...sellOrders].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10).map(o=>(
                    <tr key={o.id}>
                      <td style={{ fontSize: 10, fontFamily: "monospace" }}>{o.id.substring(0,8)}</td>
                      <td>{o.productTitle}</td>
                      <td>{o.buyer===user.username?<span className="bm-warn">KAUF</span>:<span style={{color:"hsl(120 60% 55%)"}}>VERKAUF</span>}</td>
                      <td className="bm-ltc">{o.price} LTC</td>
                      <td><span className="bm-badge">{o.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                  {buyOrders.length+sellOrders.length===0&&<tr><td colSpan={5} style={{textAlign:"center"}}>Keine Transaktionen.</td></tr>}
                </tbody>
              </table>
            </>
          )}
          {tab === 'orders' && (
            <>
              <h2>Meine Käufe</h2>
              <table className="bm-table">
                <thead><tr><th>Artikel</th><th>Verkäufer</th><th>Preis</th><th>Status</th><th>Aktion</th></tr></thead>
                <tbody>
                  {buyOrders.length===0&&<tr><td colSpan={5} style={{textAlign:"center"}}>Keine Käufe.</td></tr>}
                  {buyOrders.map(o=>(
                    <tr key={o.id}><td>{o.productTitle}</td><td><Link to={`/profile/${o.seller}`} className="bm-link">{o.seller}</Link></td><td className="bm-ltc">{o.price}</td><td><span className="bm-badge">{o.status.toUpperCase()}</span></td>
                    <td>{(o.status==='escrow'||o.status==='shipped')?<button className="bm-btn-secondary" onClick={()=>handleConfirm(o.id)} style={{fontSize:11}}>Empfangen</button>:<span className="bm-dim">Fertig</span>}</td></tr>
                  ))}
                </tbody>
              </table>
              <h2 style={{marginTop:16}}>Meine Verkäufe</h2>
              <table className="bm-table">
                <thead><tr><th>Artikel</th><th>Käufer</th><th>Preis</th><th>Status</th><th>Aktion</th></tr></thead>
                <tbody>
                  {sellOrders.length===0&&<tr><td colSpan={5} style={{textAlign:"center"}}>Keine Verkäufe.</td></tr>}
                  {sellOrders.map(o=>(
                    <tr key={o.id}><td>{o.productTitle}</td><td>{o.buyer}</td><td className="bm-ltc">{o.price}</td><td><span className="bm-badge">{o.status.toUpperCase()}</span></td>
                    <td>{o.status==='escrow'?<button className="bm-btn-secondary" onClick={()=>handleShip(o.id)} style={{fontSize:11}}>Versendet</button>:<span className="bm-dim">{o.status==='shipped'?'Warte auf Käufer':'Fertig'}</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {tab === 'listings' && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h2 style={{margin:0}}>Meine Listings</h2>
                <Link to="/create-listing"><button className="bm-btn-accent">+ Neues Listing</button></Link>
              </div>
              <table className="bm-table">
                <thead><tr><th>Titel</th><th>Preis</th><th>Kategorie</th><th>Aktion</th></tr></thead>
                <tbody>
                  {myProducts.length===0&&<tr><td colSpan={4} style={{textAlign:"center"}}>Keine Listings.</td></tr>}
                  {myProducts.map(p=>(
                    <tr key={p.id}><td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link></td><td className="bm-ltc">{p.price}</td><td><span className="bm-badge">{p.category}</span></td>
                    <td><button className="bm-btn-danger" onClick={()=>handleDelete(p.id)} style={{fontSize:10}}>Löschen</button></td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {tab === 'wallet' && (
            <>
              <h2>Wallet</h2>
              <div className="bm-card" style={{padding:14}}>
                <div style={{fontSize:12}}>
                  <div><span className="bm-dim">Guthaben:</span> <span className="bm-ltc" style={{fontSize:20,fontWeight:"bold"}}>{user.ltcBalance.toFixed(4)} LTC</span></div>
                  <div><span className="bm-dim">≈ USD:</span> ${(user.ltcBalance*87.42).toFixed(2)}</div>
                  <div style={{marginTop:6}}><span className="bm-dim">Einzahlungsadresse:</span> <span style={{fontFamily:"monospace",fontSize:11,wordBreak:"break-all"}}>{user.ltcAddress}</span></div>
                </div>
                <hr className="bm-separator" />
                <button className="bm-btn-accent" onClick={handleDeposit}>+ Einzahlen (Demo)</button>
                <span className="bm-dim" style={{marginLeft:8,fontSize:10}}>Demo-Wallet — kein echtes Krypto.</span>
              </div>
            </>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
