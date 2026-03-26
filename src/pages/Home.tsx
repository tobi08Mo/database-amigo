import { Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, getCategoriesWithAll, getCategories, seedIfEmpty, getUsers, getOrders } from "@/lib/store";
import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState(getProducts());
  useEffect(() => { seedIfEmpty(); setProducts(getProducts()); }, []);
  const featured = products.filter(p => p.active).slice(0, 8);
  const categories = getCategories();
  const users = getUsers();
  const orders = getOrders();

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        {/* Hero */}
        <div className="bm-card" style={{ textAlign: "center", padding: "28px 20px", marginBottom: 18 }}>
          <img src="/images/logo.png" alt="Basta Market" style={{ width: 56, height: 56, marginBottom: 10, filter: "invert(1)" }} />
          <h1 style={{ fontSize: 22, marginBottom: 6, letterSpacing: 3 }}>BASTA MARKET</h1>
          <p style={{ fontSize: 13, color: "hsl(0 0% 55%)", maxWidth: 400, margin: "0 auto" }}>
            Pseudonymer Marketplace — Sicher · Anonym · Escrow
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14, fontSize: 12 }}>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{users.length}</span><div className="bm-dim" style={{ fontSize: 10 }}>Benutzer</div></div>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{products.filter(p=>p.active).length}</span><div className="bm-dim" style={{ fontSize: 10 }}>Listings</div></div>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{orders.filter(o=>o.status==='completed').length}</span><div className="bm-dim" style={{ fontSize: 10 }}>Transaktionen</div></div>
            <div><span className="bm-ltc" style={{ fontSize: 18, fontWeight: "bold" }}>$87.42</span><div className="bm-dim" style={{ fontSize: 10 }}>LTC Kurs</div></div>
          </div>
        </div>

        {/* Categories chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          {categories.map(c => (
            <Link key={c} to={`/listings?cat=${c}`} style={{ textDecoration: "none" }}>
              <span className="bm-badge" style={{ padding: "5px 12px", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                {c} <span className="bm-dim">({products.filter(p => p.category === c && p.active).length})</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Listings */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Aktuelle Listings</h2>
          <Link to="/listings" className="bm-link" style={{ fontSize: 12 }}>Alle anzeigen →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {featured.map(p => (
            <div key={p.id} className="bm-card" style={{ padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Link to={`/product/${p.id}`} className="bm-link" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</Link>
                  <span className="bm-ltc" style={{ fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap", marginLeft: 8 }}>{p.price} LTC</span>
                </div>
                <p className="bm-dim" style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{p.description.substring(0, 90)}...</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={`/profile/${p.seller}`} className="bm-dim" style={{ fontSize: 11, textDecoration: "none" }}>
                  👤 {p.seller}
                </Link>
                <span className="bm-badge">{p.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bm-card" style={{ marginTop: 18, padding: 16, fontSize: 12 }}>
          <h3 style={{ marginBottom: 8 }}>⚠ Regeln & Hinweise</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, lineHeight: 1.7 }}>
            <div>• Alle Transaktionen über Escrow</div>
            <div>• Ehrliches Feedback nach jeder Transaktion</div>
            <div>• PGP für sensible Kommunikation</div>
            <div>• Scamming = permanenter Bann</div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
