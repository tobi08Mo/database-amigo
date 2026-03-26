import { useParams, Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProductById, getCurrentUser, createOrder } from "@/lib/store";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id || "");
  const user = getCurrentUser();

  if (!product) return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><h1>Produkt nicht gefunden</h1></div><RetroFooter /></div>
  );

  const handleBuy = () => {
    if (!user) return;
    if (user.username === product.seller) { alert("Du kannst dein eigenes Listing nicht kaufen."); return; }
    if (user.ltcBalance < product.price) { alert("Nicht genügend LTC. Dein Guthaben: " + user.ltcBalance.toFixed(4) + " LTC"); return; }
    if (!confirm(`"${product.title}" für ${product.price} LTC kaufen?\n\nBetrag wird im Escrow gehalten.`)) return;
    const order = createOrder(product.id, user.username);
    if (order) { alert("✓ Bestellung aufgegeben! Escrow aktiv.\nOrder-ID: " + order.id); navigate("/dashboard"); }
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <p className="bm-dim" style={{ fontSize: 11, marginBottom: 10 }}>
          <Link to="/home" className="bm-link">Home</Link> → <Link to="/listings" className="bm-link">Listings</Link> → {product.title}
        </p>
        <div className="bm-card" style={{ padding: 18 }}>
          <div className="bm-product-layout" style={{ display: "flex", gap: 18 }}>
            <div className="bm-product-image" style={{ width: 140, flexShrink: 0, textAlign: "center" }}>
              <div style={{ width: 130, height: 130, background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 22%)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(0 0% 35%)", fontSize: 11 }}>[Kein Bild]</div>
              <div style={{ marginTop: 8 }}><span className="bm-badge">{product.category}</span></div>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 17 }}>{product.title}</h1>
              <div style={{ fontSize: 12, marginBottom: 12 }}>
                <div><span className="bm-dim">Verkäufer:</span> <Link to={`/profile/${product.seller}`} className="bm-link">{product.seller}</Link></div>
                <div><span className="bm-dim">Preis:</span> <span className="bm-ltc" style={{ fontWeight: "bold", fontSize: 16 }}>{product.price} LTC</span></div>
                <div><span className="bm-dim">Versand:</span> {product.shipping}</div>
              </div>
              <hr className="bm-separator" />
              <h3>Beschreibung</h3>
              <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{product.description}</p>
              <hr className="bm-separator" />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {user && user.username !== product.seller && (
                  <button className="bm-btn-primary" onClick={handleBuy} style={{ width: "auto", padding: "8px 20px" }}>Kaufen (Escrow)</button>
                )}
                <Link to={`/messages?to=${product.seller}`}><button className="bm-btn-secondary">Nachricht senden</button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
