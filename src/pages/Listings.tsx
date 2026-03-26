import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, CATEGORIES } from "@/lib/store";

export default function Listings() {
  const [params] = useSearchParams();
  const initialCat = params.get("cat") || "All";
  const [category, setCategory] = useState(initialCat);
  const products = getProducts().filter(p => p.active);
  const filtered = category === "All" ? products : products.filter(p => p.category === category);

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <h1>📦 ALL LISTINGS</h1>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontFamily: "Verdana", marginRight: 8 }}>Filter by category:</span>
          <select className="retro-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-dim" style={{ marginLeft: 12, fontSize: 10 }}>{filtered.length} listing(s)</span>
        </div>
        <table className="retro-table">
          <thead>
            <tr>
              <th>LISTING TITLE</th>
              <th style={{ width: 100 }}>VENDOR</th>
              <th style={{ width: 80 }}>PRICE (LTC)</th>
              <th style={{ width: 90 }}>CATEGORY</th>
              <th style={{ width: 80 }}>SHIPPING</th>
              <th style={{ width: 70 }}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 20 }}>No listings found.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <Link to={`/product/${p.id}`} className="retro-link">{p.title}</Link>
                  <div className="text-dim" style={{ fontSize: 9, marginTop: 2 }}>{p.description.substring(0, 60)}...</div>
                </td>
                <td><Link to={`/profile/${p.seller}`} className="retro-link">{p.seller}</Link></td>
                <td className="text-ltc" style={{ fontWeight: "bold" }}>{p.price}</td>
                <td><span className="retro-badge">{p.category}</span></td>
                <td style={{ fontSize: 9 }}>{p.shipping}</td>
                <td className="text-dim" style={{ fontSize: 9 }}>{p.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RetroFooter />
    </div>
  );
}
