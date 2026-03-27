import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLtcEurRate } from "@/hooks/useLtcEurRate";

interface ListingDetail {
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

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rate } = useLtcEurRate();
  const [product, setProduct] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, position)")
        .eq("id", id)
        .single();
      setProduct(data as ListingDetail | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><p className="bm-dim">Lädt...</p></div><RetroFooter /></div>
  );
  if (!product) return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}><RetroHeader /><div className="bm-page"><h1>Produkt nicht gefunden</h1></div><RetroFooter /></div>
  );

  const images = (product.listing_images || []).sort((a, b) => a.position - b.position);

  const handleBuy = async () => {
    if (!user) return;
    if (user.username === product.seller) { alert("Du kannst dein eigenes Listing nicht kaufen."); return; }

    // Check wallet balance from DB
    const { data: wallet } = await supabase
      .from("wallets")
      .select("ltc_balance")
      .eq("username", user.username)
      .single();

    const balance = wallet?.ltc_balance || 0;
    if (balance < product.price_ltc) {
      alert(`Nicht genügend LTC. Dein Guthaben: ${balance.toFixed(4)} LTC\nBenötigt: ${product.price_ltc.toFixed(4)} LTC`);
      return;
    }

    if (!confirm(`"${product.title}" für ${product.price_eur.toFixed(2)} € (${product.price_ltc.toFixed(4)} LTC) kaufen?\n\nBetrag wird im Escrow gehalten.`)) return;

    // Deduct from buyer wallet
    const { error: debitErr } = await supabase.functions.invoke("wallet-db", {
      body: { action: "debit", username: user.username, amount_ltc: product.price_ltc, type: "purchase" },
    });
    if (debitErr) { alert("Fehler bei Abbuchung."); return; }

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        listing_id: product.id,
        buyer: user.username,
        seller: product.seller,
        product_title: product.title,
        price_eur: product.price_eur,
        price_ltc: product.price_ltc,
      })
      .select()
      .single();

    if (orderErr || !order) { alert("Fehler bei Bestellung."); return; }
    alert("✓ Bestellung aufgegeben! Escrow aktiv.\nOrder-ID: " + order.id);
    navigate("/dashboard");
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <p className="bm-dim" style={{ fontSize: 11, marginBottom: 10 }}>
          <Link to="/home" className="bm-link">Home</Link> → <Link to="/listings" className="bm-link">Listings</Link> → {product.title}
        </p>
        <div className="bm-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {/* Image carousel */}
            <div style={{ width: 280, flexShrink: 0 }}>
              {images.length > 0 ? (
                <div>
                  <img
                    src={images[imgIdx]?.image_url}
                    alt={product.title}
                    style={{ width: "100%", height: 240, objectFit: "cover", border: "1px solid hsl(0 0% 22%)" }}
                  />
                  {images.length > 1 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, overflowX: "auto" }}>
                      {images.map((img, i) => (
                        <img
                          key={i}
                          src={img.image_url}
                          alt=""
                          onClick={() => setImgIdx(i)}
                          style={{
                            width: 48, height: 48, objectFit: "cover", cursor: "pointer",
                            border: i === imgIdx ? "2px solid hsl(48 100% 60%)" : "1px solid hsl(0 0% 22%)",
                            opacity: i === imgIdx ? 1 : 0.6,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: "100%", height: 240, background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 22%)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(0 0% 35%)", fontSize: 11 }}>
                  [Kein Bild]
                </div>
              )}
              <div style={{ marginTop: 8 }}><span className="bm-badge">{product.category}</span></div>
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 17 }}>{product.title}</h1>
              <div style={{ fontSize: 12, marginBottom: 12 }}>
                <div><span className="bm-dim">Verkäufer:</span> <Link to={`/profile/${product.seller}`} className="bm-link">{product.seller}</Link></div>
                <div>
                  <span className="bm-dim">Preis:</span>{" "}
                  <span style={{ fontWeight: "bold", fontSize: 18, color: "hsl(48 100% 60%)" }}>{product.price_eur.toFixed(2)} €</span>
                  <span className="bm-ltc" style={{ marginLeft: 8, fontSize: 12 }}>({product.price_ltc.toFixed(4)} LTC)</span>
                </div>
                <div><span className="bm-dim">Typ:</span> Digitales Produkt</div>
              </div>
              <hr className="bm-separator" />
              <h3>Beschreibung</h3>
              <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{product.description}</p>
              <hr className="bm-separator" />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {user && user.username !== product.seller && (
                  <button className="bm-btn-primary" onClick={handleBuy} style={{ width: "auto", padding: "8px 20px" }}>Kaufen (Escrow)</button>
                )}
                <Link to={`/messages?to=${product.seller}`}><button className="bm-btn-secondary">Nachricht senden</button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
