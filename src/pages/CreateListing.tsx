import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, getCategories } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useLtcEurRate } from "@/hooks/useLtcEurRate";

export default function CreateListing() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { rate } = useLtcEurRate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [category, setCategory] = useState("Digital Goods");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) { navigate("/"); return null; }

  const priceLtc = priceEur && !isNaN(parseFloat(priceEur)) && rate > 0
    ? (parseFloat(priceEur) / rate) : 0;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) { alert("Maximal 10 Bilder."); return; }
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eur = parseFloat(priceEur);
    if (isNaN(eur) || eur <= 0) { alert("Ungültiger Preis."); return; }
    if (priceLtc <= 0) { alert("LTC-Kurs nicht verfügbar."); return; }
    setSubmitting(true);

    try {
      // Create listing
      const { data: listing, error: listErr } = await supabase
        .from("listings")
        .insert({
          seller: user.username,
          title,
          description,
          price_eur: eur,
          price_ltc: parseFloat(priceLtc.toFixed(6)),
          category,
        })
        .select()
        .single();

      if (listErr || !listing) throw listErr || new Error("Listing konnte nicht erstellt werden.");

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${listing.id}/${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { upsert: true });
        if (upErr) { console.error("Upload error:", upErr); continue; }

        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(path);

        await supabase.from("listing_images").insert({
          listing_id: listing.id,
          image_url: urlData.publicUrl,
          position: i,
        });
      }

      alert("✓ Listing erstellt!");
      navigate("/listings");
    } catch (err: any) {
      console.error(err);
      alert("Fehler: " + (err?.message || "Unbekannt"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <h1>Neues Listing erstellen</h1>
          <div className="bm-card" style={{ padding: 18 }}>
            <form onSubmit={handleSubmit}>
              <div className="bm-form-group">
                <label className="bm-form-label">Titel</label>
                <input className="bm-form-input" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="bm-form-group">
                <label className="bm-form-label">Beschreibung</label>
                <textarea className="bm-form-input" style={{ minHeight: 100, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="bm-form-group">
                <label className="bm-form-label">Preis (EUR)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input className="bm-form-input" type="number" step="0.01" min="0.01" value={priceEur} onChange={e => setPriceEur(e.target.value)} required style={{ width: 140 }} />
                  {priceLtc > 0 && (
                    <span className="bm-dim" style={{ fontSize: 12 }}>
                      ≈ <span className="bm-ltc">{priceLtc.toFixed(6)} LTC</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="bm-form-group">
                <label className="bm-form-label">Kategorie</label>
                <select className="bm-form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  {getCategories().map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Image upload */}
              <div className="bm-form-group">
                <label className="bm-form-label">Bilder (max. 10)</label>
                <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
                <button type="button" className="bm-btn-secondary" onClick={() => fileRef.current?.click()} style={{ marginBottom: 8 }}>
                  📎 Bilder hinzufügen
                </button>
                {previews.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                        <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", border: "1px solid hsl(0 0% 25%)" }} />
                        <button type="button" onClick={() => removeImage(i)} style={{
                          position: "absolute", top: -6, right: -6, background: "hsl(0 70% 50%)", color: "#fff",
                          border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="bm-btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Wird erstellt..." : "Listing veröffentlichen →"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
