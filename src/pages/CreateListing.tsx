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

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { alert("ERROR: Invalid price."); return; }
    createProduct({ seller: user.username, title, description, price: p, category, image: "", shipping });
    alert("✓ Listing created successfully!\n\n\"" + title + "\" is now live on Basta Market.");
    navigate("/listings");
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <div style={{ maxWidth: 550, margin: "0 auto" }}>
          <h1>📝 CREATE NEW LISTING</h1>
          <div className="retro-card" style={{ padding: 16 }}>
            <form onSubmit={handleSubmit}>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana", width: 100 }}>Title:</td><td><input className="retro-input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={80} /></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana", verticalAlign: "top" }}>Description:</td><td><textarea className="retro-textarea" rows={5} value={description} onChange={e => setDescription(e.target.value)} required /></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Price (LTC):</td><td><input className="retro-input" type="number" step="0.0001" min="0.0001" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: 120 }} /></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Category:</td><td><select className="retro-select" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 11, fontFamily: "Verdana" }}>Shipping:</td><td><input className="retro-input" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="e.g. Worldwide 5-14 days" required /></td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button className="retro-btn retro-btn-accent" type="submit">» PUBLISH LISTING «</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
