import { Link } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useLtcEurRate } from "@/hooks/useLtcEurRate";

interface Listing {
  id: string; seller: string; title: string; description: string;
  price_eur: number; price_ltc: number; category: string; active: boolean;
  listing_images: { image_url: string; position: number }[];
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({ users: 0, listings: 0, orders: 0 });
  const { rate } = useLtcEurRate();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, position)")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      setListings((data as any) || []);

      const { count: orderCount } = await supabase
        .from("orders").select("*", { count: "exact", head: true }).eq("status", "completed");
      const { count: listingCount } = await supabase
        .from("listings").select("*", { count: "exact", head: true }).eq("active", true);
      const { count: walletCount } = await supabase
        .from("wallets").select("*", { count: "exact", head: true });
      setStats({ users: walletCount || 0, listings: listingCount || 0, orders: orderCount || 0 });
    };
    load();
  }, []);

  const categories = [...new Set(listings.map(l => l.category))];
  const featured = listings;

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        {/* Hero */}
        <div className="bm-card" style={{ textAlign: "center", padding: "28px 20px", marginBottom: 18 }}>
          <img src="/images/logo.png" alt="Basta Market" style={{ width: 56, height: 56, marginBottom: 10, filter: "invert(1)" }} />
          <h1 style={{ fontSize: 22, marginBottom: 6, letterSpacing: 3 }}>BASTA MARKET</h1>
          <p style={{ fontSize: 13, color: "hsl(0 0% 55%)", maxWidth: 400, margin: "0 auto" }}>
            Pseudonymer Marketplace — Sicher · Anonym · Escrow
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14, fontSize: 12 }}>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{stats.users}</span><div className="bm-dim" style={{ fontSize: 10 }}>Benutzer</div></div>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{stats.listings}</span><div className="bm-dim" style={{ fontSize: 10 }}>Listings</div></div>
            <div><span style={{ fontSize: 18, fontWeight: "bold" }}>{stats.orders}</span><div className="bm-dim" style={{ fontSize: 10 }}>Transaktionen</div></div>
            <div><span className="bm-ltc" style={{ fontSize: 18, fontWeight: "bold" }}>{rate ? `€${rate.toFixed(2)}` : '...'}</span><div className="bm-dim" style={{ fontSize: 10 }}>LTC Kurs</div></div>
          </div>
        </div>

        {/* Categories chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          {categories.map(c => (
            <Link key={c} to={`/listings?cat=${c}`} style={{ textDecoration: "none" }}>
              <span className="bm-badge" style={{ padding: "5px 12px", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                {c} <span className="bm-dim">({products.filter(p => p.category === c && p.active).length})</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Listings */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Aktuelle Listings</h2>
          <Link to="/listings" className="bm-link" style={{ fontSize: 12 }}>Alle anzeigen →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {featured.map(p => (
            <div key={p.id} className="bm-card" style={{ padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Link to={`/product/${p.id}`} className="bm-link" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</Link>
                  <span className="bm-ltc" style={{ fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap", marginLeft: 8 }}>{p.price} LTC</span>
                </div>
                <p className="bm-dim" style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{p.description.substring(0, 90)}...</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={`/profile/${p.seller}`} className="bm-dim" style={{ fontSize: 11, textDecoration: "none" }}>
                  👤 {p.seller}
                </Link>
                <span className="bm-badge">{p.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bm-card" style={{ marginTop: 18, padding: 16, fontSize: 12 }}>
          <h3 style={{ marginBottom: 8 }}>⚠ Regeln & Hinweise</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, lineHeight: 1.7 }}>
            <div>• Alle Transaktionen über Escrow</div>
            <div>• Ehrliches Feedback nach jeder Transaktion</div>
            <div>• PGP für sensible Kommunikation</div>
            <div>• Scamming = permanenter Bann</div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
