import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { supabase } from "@/integrations/supabase/client";

function Stars({ rating }: { rating: number }) {
  return <span>{[1,2,3,4,5].map(i => <span key={i} className={i <= Math.round(rating) ? "bm-star" : "bm-star-empty"}>★</span>)}</span>;
}

interface ProfileData {
  username: string;
  bio: string;
  join_date: string;
  feedback_score: number;
  total_sales: number;
}

interface ListingData {
  id: string;
  title: string;
  price_eur: number;
  price_ltc: number;
  category: string;
}

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      const [profileRes, listingsRes] = await Promise.all([
        supabase.from("profiles" as any).select("username, bio, join_date, feedback_score, total_sales").eq("username", username).single(),
        supabase.from("listings").select("id, title, price_eur, price_ltc, category").eq("seller", username).eq("active", true),
      ]);
      if (profileRes.data) setProfile(profileRes.data as any as ProfileData);
      if (listingsRes.data) setListings(listingsRes.data);
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) return <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><div className="bm-dim">Laden...</div></div><RetroFooter /></div>;
  if (!profile) return <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><h1>Benutzer nicht gefunden</h1></div><RetroFooter /></div>;

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Profil: {profile.username}</h1>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <div className="bm-card" style={{ padding: 14, textAlign: "center" }}>
              <div style={{ width: 70, height: 70, margin: "0 auto 10px", background: "hsl(0 0% 18%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👤</div>
              <div style={{ fontSize: 12 }}>
                <div><span className="bm-dim">Beigetreten:</span> {profile.join_date}</div>
                <div><span className="bm-dim">Verkäufe:</span> {profile.total_sales}</div>
                <div><span className="bm-dim">Bewertung:</span> <Stars rating={Number(profile.feedback_score)} /> ({Number(profile.feedback_score)})</div>
              </div>
              {profile.bio && <><hr className="bm-separator" /><p style={{ fontSize: 11, fontStyle: "italic", color: "hsl(0 0% 60%)" }}>{profile.bio}</p></>}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2>Listings ({listings.length})</h2>
            {listings.length === 0 ? <p className="bm-dim" style={{ fontSize: 11 }}>Keine Listings.</p> : (
              <table className="bm-table">
                <thead><tr><th>Titel</th><th style={{ width: 80 }}>Preis</th><th style={{ width: 90 }}>Kategorie</th></tr></thead>
                <tbody>{listings.map(p => <tr key={p.id}><td><Link to={`/product/${p.id}`} className="bm-link">{p.title}</Link></td><td className="bm-ltc">{p.price_ltc.toFixed(4)} LTC</td><td><span className="bm-badge">{p.category}</span></td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
