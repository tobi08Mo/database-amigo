import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, createProduct, CATEGORIES } from "@/lib/store";

export default function CreateListing() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [shipping, setShipping] = useState("");

  if (!user) { navigate("/"); return null; }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { alert("Ungültiger Preis."); return; }
    createProduct({ seller: user.username, title, description, price: p, category, image: "", shipping });
    alert("✓ Listing erstellt!");
    navigate("/listings");
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h1>Neues Listing erstellen</h1>
          <div className="bm-card" style={{ padding: 18 }}>
            <form onSubmit={handleSubmit}>
              <div className="bm-form-group"><label className="bm-form-label">Titel</label><input className="bm-form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
              <div className="bm-form-group"><label className="bm-form-label">Beschreibung</label><textarea className="bm-form-input" style={{ minHeight: 100, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} required /></div>
              <div className="bm-form-group"><label className="bm-form-label">Preis (LTC)</label><input className="bm-form-input" type="number" step="0.0001" min="0.0001" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: 140 }} /></div>
              <div className="bm-form-group"><label className="bm-form-label">Kategorie</label><select className="bm-form-input" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="bm-form-group"><label className="bm-form-label">Versand</label><input className="bm-form-input" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="z.B. Weltweit 5-14 Tage" required /></div>
              <button className="bm-btn-primary" type="submit">Listing veröffentlichen →</button>
            </form>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
