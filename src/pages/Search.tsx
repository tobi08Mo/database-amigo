import { useState } from "react";
import { Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts } from "@/lib/store";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof getProducts>>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.toLowerCase();
    setResults(getProducts().filter(p => p.active && (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))));
    setSearched(true);
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Suche</h1>
        <div className="bm-card" style={{ padding: 14, marginBottom: 14 }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <input className="bm-form-input" placeholder="Suche nach Titel, Beschreibung, Verkäufer..." value={query} onChange={e => setQuery(e.target.value)} />
            <button className="bm-btn-primary" type="submit" style={{ width: "auto", padding: "8px 20px" }}>Suchen</button>
          </form>
        </div>
        {searched && (
          <>
            <p className="bm-dim" style={{ fontSize: 11, marginBottom: 8 }}>{results.length} Ergebnis(se) für "{query}"</p>
            <table className="bm-table">
              <thead><tr><th>Listing</th><th style={{ width: 100 }}>Verkäufer</th><th style={{ width: 80 }}>Preis</th><th style={{ width: 90 }}>Kategorie</th></tr></thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 16 }}>Keine Ergebnisse.</td></tr>}
                {results.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link></td>
                    <td><Link to={`/profile/${p.seller}`} className="bm-link">{p.seller}</Link></td>
                    <td className="bm-ltc">{p.price} LTC</td>
                    <td><span className="bm-badge">{p.category}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      <RetroFooter />
    </div>
  );
}
