import { Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProducts, CATEGORIES, seedIfEmpty } from "@/lib/store";
import { useEffect, useState } from "react";

export default function Index() {
  const [products, setProducts] = useState(getProducts());
  useEffect(() => { seedIfEmpty(); setProducts(getProducts()); }, []);

  const featured = products.filter(p => p.active).slice(0, 6);

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <table style={{ width: "100%", marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top", width: "160px", paddingRight: 12 }}>
                <div className="retro-card">
                  <h3>CATEGORIES</h3>
                  <hr className="retro-separator" />
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <div key={c} style={{ marginBottom: 4 }}>
                      <Link to={`/listings?cat=${c}`} className="retro-link" style={{ fontSize: 11 }}>
                        » {c}
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="retro-card" style={{ marginTop: 8 }}>
                  <h3>LTC PRICE</h3>
                  <hr className="retro-separator" />
                  <div className="text-ltc" style={{ fontSize: 16, fontWeight: "bold" }}>$87.42</div>
                  <div className="text-dim" style={{ fontSize: 9 }}>Last updated: just now</div>
                </div>
                <div className="retro-card" style={{ marginTop: 8 }}>
                  <h3>STATS</h3>
                  <hr className="retro-separator" />
                  <div style={{ fontSize: 10 }}>
                    <div>Vendors: <span style={{ color: "hsl(120,70%,55%)" }}>3</span></div>
                    <div>Listings: <span style={{ color: "hsl(120,70%,55%)" }}>{products.length}</span></div>
                    <div>Online: <span className="retro-blink" style={{ color: "hsl(120,70%,55%)" }}>●</span> 14</div>
                  </div>
                </div>
              </td>
              <td style={{ verticalAlign: "top" }}>
                <div className="retro-card" style={{ textAlign: "center", padding: "16px 12px", marginBottom: 12 }}>
                  <h1 style={{ borderBottom: "none", marginBottom: 6, fontSize: 22 }}>
                    ★ BASTA MARKET ★
                  </h1>
                  <p style={{ fontFamily: "Verdana, sans-serif", fontSize: 11, color: "hsl(120,40%,55%)" }}>
                    The Pseudonymous Marketplace — Secure · Anonymous · Escrow Protected
                  </p>
                  <p style={{ fontSize: 10, marginTop: 6, color: "hsl(45,100%,55%)" }}>
                    All transactions are conducted in Litecoin (LTC). Escrow is mandatory.
                  </p>
                </div>

                <h2>▸ FEATURED LISTINGS</h2>
                <table className="retro-table">
                  <thead>
                    <tr>
                      <th>LISTING</th>
                      <th style={{ width: 100 }}>VENDOR</th>
                      <th style={{ width: 80 }}>PRICE</th>
                      <th style={{ width: 100 }}>CATEGORY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featured.map(p => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/product/${p.id}`} className="retro-link">{p.title}</Link>
                          <div className="text-dim" style={{ fontSize: 10, marginTop: 2 }}>
                            {p.description.substring(0, 80)}...
                          </div>
                        </td>
                        <td>
                          <Link to={`/profile/${p.seller}`} className="retro-link">{p.seller}</Link>
                        </td>
                        <td className="text-ltc" style={{ fontWeight: "bold" }}>
                          {p.price} LTC
                        </td>
                        <td><span className="retro-badge">{p.category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <Link to="/listings">
                    <button className="retro-btn">» VIEW ALL LISTINGS «</button>
                  </Link>
                </div>

                <div className="retro-card" style={{ marginTop: 16, fontSize: 10 }}>
                  <h3>⚠ RULES & GUIDELINES</h3>
                  <hr className="retro-separator" />
                  <ul style={{ paddingLeft: 16, lineHeight: 1.8 }}>
                    <li>All transactions must use escrow. No FE (Finalize Early).</li>
                    <li>Use PGP for sensitive communications.</li>
                    <li>Disputes will be handled by market admins.</li>
                    <li>Leave honest feedback after every transaction.</li>
                    <li>No scamming. Accounts will be banned permanently.</li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <RetroFooter />
    </div>
  );
}
