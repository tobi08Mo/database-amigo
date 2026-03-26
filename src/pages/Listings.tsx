import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, CATEGORIES } from "@/lib/store";

export default function Listings() {
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("cat") || "All");
  const products = getProducts().filter(p => p.active);
  const filtered = category === "All" ? products : products.filter(p => p.category === category);

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Alle Listings</h1>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "hsl(0 0% 55%)" }}>Kategorie:</span>
          <select className="bm-form-input" style={{ width: 160 }} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="bm-dim" style={{ fontSize: 11 }}>{filtered.length} Ergebnisse</span>
        </div>
        <table className="bm-table">
          <thead><tr><th>Titel</th><th style={{ width: 100 }}>Verkäufer</th><th style={{ width: 80 }}>Preis</th><th style={{ width: 90 }}>Kategorie</th><th style={{ width: 80 }}>Versand</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>Keine Listings gefunden.</td></tr>}
            {filtered.map(p => (
              <tr key={p.id}>
                <td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link><div className="bm-dim" style={{ fontSize: 10 }}>{p.description.substring(0, 60)}...</div></td>
                <td><Link to={`/profile/${p.seller}`} className="bm-link">{p.seller}</Link></td>
                <td className="bm-ltc" style={{ fontWeight: "bold" }}>{p.price}</td>
                <td><span className="bm-badge">{p.category}</span></td>
                <td style={{ fontSize: 10 }}>{p.shipping}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RetroFooter />
    </div>
  );
}
