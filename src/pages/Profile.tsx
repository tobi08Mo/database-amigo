import { useParams, Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getUserByName, getProducts, getReviews } from "@/lib/store";

function Stars({ rating }: { rating: number }) {
  return <span>{[1,2,3,4,5].map(i => <span key={i} className={i <= Math.round(rating) ? "bm-star" : "bm-star-empty"}>★</span>)}</span>;
}

export default function Profile() {
  const { username } = useParams();
  const user = getUserByName(username || "");
  const products = getProducts().filter(p => p.seller === username && p.active);
  const reviews = getReviews().filter(r => r.to === username);

  if (!user) return <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><h1>Benutzer nicht gefunden</h1></div><RetroFooter /></div>;

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Profil: {user.username}</h1>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <div className="bm-card" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ width: 70, height: 70, margin: "0 auto 10px", background: "hsl(0 0% 18%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👤</div>
              <div style={{ fontSize: 12 }}>
                <div><span className="bm-dim">Beigetreten:</span> {user.joinDate}</div>
                <div><span className="bm-dim">Verkäufe:</span> {user.totalSales}</div>
                <div><span className="bm-dim">Bewertung:</span> <Stars rating={user.feedbackScore} /> ({user.feedbackScore})</div>
              </div>
              {user.bio && <><hr className="bm-separator" /><p style={{ fontSize: 11, fontStyle: "italic", color: "hsl(0 0% 60%)" }}>{user.bio}</p></>}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2>Listings ({products.length})</h2>
            {products.length === 0 ? <p className="bm-dim" style={{ fontSize: 11 }}>Keine Listings.</p> : (
              <table className="bm-table">
                <thead><tr><th>Titel</th><th style={{ width: 80 }}>Preis</th><th style={{ width: 90 }}>Kategorie</th></tr></thead>
                <tbody>{products.map(p => <tr key={p.id}><td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link></td><td className="bm-ltc">{p.price} LTC</td><td><span className="bm-badge">{p.category}</span></td></tr>)}</tbody>
              </table>
            )}
            <h2 style={{ marginTop: 18 }}>Bewertungen ({reviews.length})</h2>
            {reviews.length === 0 ? <p className="bm-dim" style={{ fontSize: 11 }}>Noch keine Bewertungen.</p> : reviews.map(r => (
              <div className="bm-card" key={r.id} style={{ padding: 10 }}>
                <Stars rating={r.rating} /><span className="bm-dim" style={{ fontSize: 10, marginLeft: 8 }}>von {r.from} am {r.date}</span>
                <p style={{ fontSize: 12, marginTop: 4 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
