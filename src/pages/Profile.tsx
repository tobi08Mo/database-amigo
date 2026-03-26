import { useParams, Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getUserByName, getProducts, getReviews } from "@/lib/store";

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? "retro-star" : "retro-star-empty"}>★</span>
      ))}
    </span>
  );
}

export default function Profile() {
  const { username } = useParams();
  const user = getUserByName(username || "");
  const products = getProducts().filter(p => p.seller === username && p.active);
  const reviews = getReviews().filter(r => r.to === username);

  if (!user) return (
    <div><RetroHeader /><div className="retro-page"><h1>USER NOT FOUND</h1></div><RetroFooter /></div>
  );

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <h1>👤 VENDOR PROFILE: {user.username}</h1>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top", width: 250, paddingRight: 16 }}>
                <div className="retro-card" style={{ padding: 12 }}>
                  <div style={{ width: 80, height: 80, margin: "0 auto 8px", background: "hsl(120,20%,15%)", border: "1px solid hsl(120,30%,25%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                    👤
                  </div>
                  <table style={{ width: "100%", fontSize: 11 }}>
                    <tbody>
                      <tr><td className="text-dim">Username:</td><td style={{ fontWeight: "bold" }}>{user.username}</td></tr>
                      <tr><td className="text-dim">Joined:</td><td>{user.joinDate}</td></tr>
                      <tr><td className="text-dim">Sales:</td><td>{user.totalSales}</td></tr>
                      <tr><td className="text-dim">Rating:</td><td><Stars rating={user.feedbackScore} /> ({user.feedbackScore})</td></tr>
                    </tbody>
                  </table>
                  {user.bio && (
                    <>
                      <hr className="retro-separator" />
                      <p style={{ fontSize: 10, fontStyle: "italic" }}>{user.bio}</p>
                    </>
                  )}
                </div>
              </td>
              <td style={{ verticalAlign: "top" }}>
                <h2>▸ ACTIVE LISTINGS ({products.length})</h2>
                {products.length === 0 ? <p className="text-dim" style={{ fontSize: 10 }}>No active listings.</p> : (
                  <table className="retro-table">
                    <thead><tr><th>TITLE</th><th style={{ width: 80 }}>PRICE</th><th style={{ width: 90 }}>CATEGORY</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td><Link to={`/product/${p.id}`} className="retro-link">{p.title}</Link></td>
                          <td className="text-ltc">{p.price} LTC</td>
                          <td><span className="retro-badge">{p.category}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <h2 style={{ marginTop: 16 }}>▸ FEEDBACK ({reviews.length})</h2>
                {reviews.length === 0 ? <p className="text-dim" style={{ fontSize: 10 }}>No feedback yet.</p> : (
                  reviews.map(r => (
                    <div className="retro-card" key={r.id} style={{ padding: 8 }}>
                      <Stars rating={r.rating} />
                      <span className="text-dim" style={{ fontSize: 9, marginLeft: 8 }}>by {r.from} on {r.date}</span>
                      <p style={{ fontSize: 11, marginTop: 4 }}>{r.text}</p>
                    </div>
                  ))
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <RetroFooter />
    </div>
  );
}
