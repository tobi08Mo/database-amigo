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
    const all = getProducts().filter(p => p.active);
    const found = all.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.seller.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
    setResults(found);
    setSearched(true);
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <h1>🔍 SEARCH LISTINGS</h1>
        <div className="retro-card" style={{ padding: 12, marginBottom: 12 }}>
          <form onSubmit={handleSearch}>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight: 8 }}>
                    <input className="retro-input" placeholder="Search by title, description, vendor, category..." value={query} onChange={e => setQuery(e.target.value)} />
                  </td>
                  <td style={{ width: 100 }}>
                    <button className="retro-btn" type="submit" style={{ width: "100%" }}>SEARCH</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>
        {searched && (
          <>
            <p className="text-dim" style={{ fontSize: 10, marginBottom: 8 }}>{results.length} result(s) for "{query}"</p>
            <table className="retro-table">
              <thead>
                <tr><th>LISTING</th><th style={{ width: 100 }}>VENDOR</th><th style={{ width: 80 }}>PRICE</th><th style={{ width: 90 }}>CATEGORY</th></tr>
              </thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 16 }}>No results found.</td></tr>}
                {results.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/product/${p.id}`} className="retro-link">{p.title}</Link></td>
                    <td><Link to={`/profile/${p.seller}`} className="retro-link">{p.seller}</Link></td>
                    <td className="text-ltc">{p.price} LTC</td>
                    <td><span className="retro-badge">{p.category}</span></td>
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
