import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, getCategoriesWithAll } from "@/lib/store";

export default function Listings() {
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("cat") || "All");
  const products = getProducts().filter(p => p.active);
  const filtered = category === "All" ? products : products.filter(p => p.category === category);
  const categories = getCategoriesWithAll();

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ margin: 0 }}>Alle Listings</h1>
          <span className="bm-dim" style={{ fontSize: 12 }}>{filtered.length} Ergebnis(se)</span>
        </div>

        {/* Category filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {categories.map(c => (
            <span
              key={c}
              onClick={() => setCategory(c)}
              className="bm-badge"
              style={{
                padding: "5px 12px", fontSize: 12, cursor: "pointer",
                background: c === category ? "hsl(0 0% 30%)" : undefined,
                color: c === category ? "hsl(0 0% 95%)" : undefined,
              }}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Product cards grid */}
        {filtered.length === 0 ? (
          <div className="bm-card" style={{ textAlign: "center", padding: 30 }}>
            <p className="bm-dim">Keine Listings in dieser Kategorie.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} className="bm-card" style={{ padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <Link to={`/product/${p.id}`} className="bm-link" style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</Link>
                    <span className="bm-ltc" style={{ fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap", marginLeft: 8 }}>{p.price} LTC</span>
                  </div>
                  <p className="bm-dim" style={{ fontSize: 11, lineHeight: 1.5, margin: "4px 0 8px" }}>{p.description.substring(0, 80)}...</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid hsl(0 0% 18%)", paddingTop: 8 }}>
                  <Link to={`/profile/${p.seller}`} className="bm-dim" style={{ fontSize: 11, textDecoration: "none" }}>👤 {p.seller}</Link>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="bm-badge">{p.category}</span>
                    <span className="bm-dim" style={{ fontSize: 9 }}>{p.shipping}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <RetroFooter />
    </div>
  );
}
