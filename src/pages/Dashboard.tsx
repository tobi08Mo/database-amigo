import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, getOrders, getProducts, updateOrderStatus, updateUser, deleteProduct, createReview, getReviews } from "@/lib/store";

export default function Dashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'orders' | 'listings' | 'wallet'>('overview');
  const [refresh, setRefresh] = useState(0);

  if (!user) { navigate("/login"); return null; }

  const allOrders = getOrders();
  const buyOrders = allOrders.filter(o => o.buyer === user.username);
  const sellOrders = allOrders.filter(o => o.seller === user.username);
  const myProducts = getProducts().filter(p => p.seller === user.username);
  const reviews = getReviews();

  const handleDeposit = () => {
    const amt = prompt("Enter LTC amount to deposit (demo):");
    if (amt && !isNaN(parseFloat(amt)) && parseFloat(amt) > 0) {
      updateUser(user.username, { ltcBalance: user.ltcBalance + parseFloat(amt) });
      alert("✓ Deposited " + amt + " LTC (demo)");
      window.location.reload();
    }
  };

  const handleConfirmReceived = (orderId: string) => {
    if (!confirm("Confirm you received this order? Funds will be released to seller.")) return;
    updateOrderStatus(orderId, 'completed');
    const rating = prompt("Rate the seller (1-5 stars):");
    const r = parseInt(rating || "5");
    const text = prompt("Leave feedback (optional):") || "Good transaction.";
    const order = allOrders.find(o => o.id === orderId);
    if (order) createReview(orderId, user.username, order.seller, Math.min(5, Math.max(1, r || 5)), text);
    alert("✓ Order completed! Funds released.");
    setRefresh(refresh + 1);
    window.location.reload();
  };

  const handleMarkShipped = (orderId: string) => {
    updateOrderStatus(orderId, 'shipped');
    alert("✓ Marked as shipped.");
    window.location.reload();
  };

  const handleDeleteListing = (id: string) => {
    if (confirm("Delete this listing?")) { deleteProduct(id); window.location.reload(); }
  };

  const tabStyle = (t: string) => ({
    ...({ padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: "Verdana", border: "1px solid hsl(120,30%,25%)", borderBottom: tab === t ? "none" : "1px solid hsl(120,30%,25%)", background: tab === t ? "hsl(220,15%,12%)" : "hsl(220,15%,8%)", color: tab === t ? "hsl(120,70%,55%)" : "hsl(120,20%,40%)", textTransform: "uppercase" as const, letterSpacing: 1 }),
  });

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <h1>📊 DASHBOARD — {user.username}</h1>
        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          <span style={tabStyle('overview')} onClick={() => setTab('overview')}>Overview</span>
          <span style={tabStyle('orders')} onClick={() => setTab('orders')}>Orders</span>
          <span style={tabStyle('listings')} onClick={() => setTab('listings')}>My Listings</span>
          <span style={tabStyle('wallet')} onClick={() => setTab('wallet')}>Wallet</span>
        </div>
        <div className="retro-card" style={{ padding: 14 }}>
          {tab === 'overview' && (
            <>
              <table style={{ width: "100%", fontSize: 11 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: 8 }}>
                      <div className="retro-card" style={{ textAlign: "center" }}>
                        <div className="text-dim" style={{ fontSize: 9 }}>LTC BALANCE</div>
                        <div className="text-ltc" style={{ fontSize: 18, fontWeight: "bold" }}>{user.ltcBalance.toFixed(4)}</div>
                      </div>
                    </td>
                    <td style={{ padding: 8 }}>
                      <div className="retro-card" style={{ textAlign: "center" }}>
                        <div className="text-dim" style={{ fontSize: 9 }}>TOTAL SALES</div>
                        <div style={{ fontSize: 18, fontWeight: "bold" }}>{user.totalSales}</div>
                      </div>
                    </td>
                    <td style={{ padding: 8 }}>
                      <div className="retro-card" style={{ textAlign: "center" }}>
                        <div className="text-dim" style={{ fontSize: 9 }}>ACTIVE LISTINGS</div>
                        <div style={{ fontSize: 18, fontWeight: "bold" }}>{myProducts.filter(p => p.active).length}</div>
                      </div>
                    </td>
                    <td style={{ padding: 8 }}>
                      <div className="retro-card" style={{ textAlign: "center" }}>
                        <div className="text-dim" style={{ fontSize: 9 }}>OPEN ORDERS</div>
                        <div style={{ fontSize: 18, fontWeight: "bold" }}>{buyOrders.filter(o => o.status !== 'completed').length + sellOrders.filter(o => o.status !== 'completed').length}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <h3 style={{ marginTop: 12 }}>▸ RECENT TRANSACTIONS</h3>
              <table className="retro-table">
                <thead><tr><th>ID</th><th>ITEM</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th><th>DATE</th></tr></thead>
                <tbody>
                  {[...buyOrders, ...sellOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontSize: 9, fontFamily: "monospace" }}>{o.id.substring(0, 8)}</td>
                      <td>{o.productTitle}</td>
                      <td>{o.buyer === user.username ? <span className="text-warn">BUY</span> : <span style={{ color: "hsl(120,70%,55%)" }}>SELL</span>}</td>
                      <td className="text-ltc">{o.price} LTC</td>
                      <td><span className="retro-badge">{o.status.toUpperCase()}</span></td>
                      <td className="text-dim">{o.createdAt}</td>
                    </tr>
                  ))}
                  {buyOrders.length + sellOrders.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center" }}>No transactions yet.</td></tr>}
                </tbody>
              </table>
            </>
          )}

          {tab === 'orders' && (
            <>
              <h2>▸ MY PURCHASES</h2>
              <table className="retro-table">
                <thead><tr><th>ITEM</th><th>SELLER</th><th>PRICE</th><th>STATUS</th><th>ACTION</th></tr></thead>
                <tbody>
                  {buyOrders.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No purchases.</td></tr>}
                  {buyOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.productTitle}</td>
                      <td><Link to={`/profile/${o.seller}`} className="retro-link">{o.seller}</Link></td>
                      <td className="text-ltc">{o.price} LTC</td>
                      <td><span className="retro-badge">{o.status.toUpperCase()}</span></td>
                      <td>
                        {(o.status === 'escrow' || o.status === 'shipped') && (
                          <button className="retro-btn" onClick={() => handleConfirmReceived(o.id)} style={{ fontSize: 9 }}>CONFIRM RECEIVED</button>
                        )}
                        {o.status === 'completed' && <span className="text-dim">Done</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 style={{ marginTop: 16 }}>▸ MY SALES</h2>
              <table className="retro-table">
                <thead><tr><th>ITEM</th><th>BUYER</th><th>PRICE</th><th>STATUS</th><th>ACTION</th></tr></thead>
                <tbody>
                  {sellOrders.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No sales.</td></tr>}
                  {sellOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.productTitle}</td>
                      <td>{o.buyer}</td>
                      <td className="text-ltc">{o.price} LTC</td>
                      <td><span className="retro-badge">{o.status.toUpperCase()}</span></td>
                      <td>
                        {o.status === 'escrow' && <button className="retro-btn" onClick={() => handleMarkShipped(o.id)} style={{ fontSize: 9 }}>MARK SHIPPED</button>}
                        {o.status === 'completed' && <span className="text-dim">Done</span>}
                        {o.status === 'shipped' && <span className="text-dim">Awaiting buyer</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'listings' && (
            <>
              <h2>▸ MY LISTINGS</h2>
              <Link to="/create-listing"><button className="retro-btn retro-btn-accent" style={{ marginBottom: 10 }}>+ NEW LISTING</button></Link>
              <table className="retro-table">
                <thead><tr><th>TITLE</th><th>PRICE</th><th>CATEGORY</th><th>DATE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {myProducts.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No listings. Create one!</td></tr>}
                  {myProducts.map(p => (
                    <tr key={p.id}>
                      <td><Link to={`/product/${p.id}`} className="retro-link">{p.title}</Link></td>
                      <td className="text-ltc">{p.price} LTC</td>
                      <td><span className="retro-badge">{p.category}</span></td>
                      <td className="text-dim">{p.createdAt}</td>
                      <td><button className="retro-btn retro-btn-danger" onClick={() => handleDeleteListing(p.id)} style={{ fontSize: 9 }}>DELETE</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'wallet' && (
            <>
              <h2>▸ WALLET</h2>
              <div className="retro-card" style={{ padding: 12 }}>
                <table style={{ fontSize: 11 }}>
                  <tbody>
                    <tr><td className="text-dim" style={{ paddingRight: 16 }}>Balance:</td><td className="text-ltc" style={{ fontSize: 18, fontWeight: "bold" }}>{user.ltcBalance.toFixed(4)} LTC</td></tr>
                    <tr><td className="text-dim">≈ USD:</td><td>${(user.ltcBalance * 87.42).toFixed(2)}</td></tr>
                    <tr><td className="text-dim">Deposit Address:</td><td style={{ fontFamily: "monospace", fontSize: 10, wordBreak: "break-all" }}>{user.ltcAddress}</td></tr>
                  </tbody>
                </table>
                <hr className="retro-separator" />
                <button className="retro-btn retro-btn-accent" onClick={handleDeposit} style={{ marginRight: 8 }}>+ DEPOSIT (DEMO)</button>
                <span className="text-dim" style={{ fontSize: 9 }}>In a real marketplace, send LTC to the address above.</span>
              </div>
              <div className="retro-card" style={{ marginTop: 10, fontSize: 9, padding: 8 }}>
                <strong className="text-warn">⚠ NOTICE:</strong> This is a demo wallet. No real cryptocurrency is involved.
              </div>
            </>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
