import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCategoriesWithAll } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useLtcEurRate } from "@/hooks/useLtcEurRate";

interface Listing {
  id: string;
  seller: string;
  title: string;
  description: string;
  price_eur: number;
  price_ltc: number;
  category: string;
  active: boolean;
  created_at: string;
  listing_images: { image_url: string; position: number }[];
}

export default function Listings() {
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("cat") || "All");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { rate } = useLtcEurRate();
  const categories = getCategoriesWithAll();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, position)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = category === "All" ? listings : listings.filter(l => l.category === category);

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ margin: 0 }}>Alle Listings</h1>
          <span className="bm-dim" style={{ fontSize: 12 }}>{filtered.length} Ergebnis(se)</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {categories.map(c => (
            <span key={c} onClick={() => setCategory(c)} className="bm-badge" style={{
              padding: "5px 12px", fontSize: 12, cursor: "pointer",
              background: c === category ? "hsl(0 0% 30%)" : undefined,
              color: c === category ? "hsl(0 0% 95%)" : undefined,
            }}>{c}</span>
          ))}
        </div>

        {loading ? (
          <div className="bm-card" style={{ textAlign: "center", padding: 30 }}>
            <p className="bm-dim">Lädt...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bm-card" style={{ textAlign: "center", padding: 30 }}>
            <p className="bm-dim">Keine Listings in dieser Kategorie.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {filtered.map(p => {
              const thumb = p.listing_images?.sort((a, b) => a.position - b.position)[0]?.image_url;
              return (
                <div key={p.id} className="bm-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
                  {thumb && (
                    <Link to={`/product/${p.id}`}>
                      <img src={thumb} alt={p.title} style={{ width: "100%", height: 160, objectFit: "cover", borderBottom: "1px solid hsl(0 0% 18%)" }} />
                    </Link>
                  )}
                  <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <Link to={`/product/${p.id}`} className="bm-link" style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</Link>
                        <span style={{ fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap", marginLeft: 8, color: "hsl(48 100% 60%)" }}>{p.price_eur.toFixed(2)} €</span>
                      </div>
                      <p className="bm-dim" style={{ fontSize: 11, lineHeight: 1.5, margin: "4px 0 8px" }}>
                        {p.description.substring(0, 80)}{p.description.length > 80 ? "..." : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid hsl(0 0% 18%)", paddingTop: 8 }}>
                      <Link to={`/profile/${p.seller}`} className="bm-dim" style={{ fontSize: 11, textDecoration: "none" }}>👤 {p.seller}</Link>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="bm-badge">{p.category}</span>
                        <span className="bm-ltc" style={{ fontSize: 10 }}>{p.price_ltc.toFixed(4)} LTC</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <RetroFooter />
    </div>
  );
}
