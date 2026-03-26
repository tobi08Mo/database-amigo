import { Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, getCategoriesWithAll, seedIfEmpty } from "@/lib/store";
import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState(getProducts());
  useEffect(() => { seedIfEmpty(); setProducts(getProducts()); }, []);
  const featured = products.filter(p => p.active).slice(0, 6);

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 180, flexShrink: 0 }}>
            <div className="bm-sidebar-card">
              <h3>Kategorien</h3>
              <hr className="bm-separator" />
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <div key={c} style={{ marginBottom: 4 }}>
                  <Link to={`/listings?cat=${c}`} className="bm-link" style={{ fontSize: 12 }}>» {c}</Link>
                </div>
              ))}
            </div>
            <div className="bm-sidebar-card">
              <h3>LTC Kurs</h3>
              <hr className="bm-separator" />
              <div className="bm-ltc" style={{ fontSize: 18, fontWeight: "bold" }}>$87.42</div>
              <div className="bm-dim" style={{ fontSize: 10 }}>Aktualisiert: gerade eben</div>
            </div>
            <div className="bm-sidebar-card">
              <h3>Statistiken</h3>
              <hr className="bm-separator" />
              <div style={{ fontSize: 11 }}>
                <div>Verkäufer: <span style={{ color: "hsl(0 0% 85%)" }}>3</span></div>
                <div>Listings: <span style={{ color: "hsl(0 0% 85%)" }}>{products.length}</span></div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="bm-card" style={{ textAlign: "center", padding: 20, marginBottom: 14 }}>
              <img src="/images/logo.png" alt="Basta Market" style={{ width: 50, height: 50, marginBottom: 8 }} />
              <h1 style={{ fontSize: 20, marginBottom: 4 }}>BASTA MARKET</h1>
              <p className="bm-dim" style={{ fontSize: 12 }}>Pseudonymer Marketplace — Sicher · Anonym · Escrow</p>
              <p className="bm-warn" style={{ fontSize: 11, marginTop: 6 }}>Alle Transaktionen in Litecoin (LTC). Escrow ist Pflicht.</p>
            </div>
            <h2>Aktuelle Listings</h2>
            <table className="bm-table">
              <thead>
                <tr><th>Listing</th><th style={{ width: 100 }}>Verkäufer</th><th style={{ width: 80 }}>Preis</th><th style={{ width: 100 }}>Kategorie</th></tr>
              </thead>
              <tbody>
                {featured.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link>
                      <div className="bm-dim" style={{ fontSize: 11, marginTop: 2 }}>{p.description.substring(0, 80)}...</div>
                    </td>
                    <td><Link to={`/profile/${p.seller}`} className="bm-link">{p.seller}</Link></td>
                    <td className="bm-ltc" style={{ fontWeight: "bold" }}>{p.price} LTC</td>
                    <td><span className="bm-badge">{p.category}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Link to="/listings"><button className="bm-btn-secondary">Alle Listings anzeigen →</button></Link>
            </div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
