import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isCurrentUserAdmin, getProducts, getUsers, getOrders, getCategories, addCategory, renameCategory, deleteCategory, deleteProduct, updateProduct, deleteUser } from "@/lib/store";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";

export default function AdminPanel() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'categories' | 'users' | 'overview'>('overview');
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "", category: "", shipping: "" });
  const [, setRefresh] = useState(0);

  if (!user || !isCurrentUserAdmin()) { navigate("/home"); return null; }

  const products = getProducts();
  const users = getUsers();
  const orders = getOrders();
  const categories = getCategories();

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    if (addCategory(newCat.trim())) { setNewCat(""); setRefresh(r => r + 1); alert("✓ Kategorie hinzugefügt."); }
    else alert("Kategorie existiert bereits.");
  };

  const handleRenameCategory = (oldName: string) => {
    if (!editCatName.trim()) return;
    if (renameCategory(oldName, editCatName.trim())) { setEditingCat(null); setEditCatName(""); setRefresh(r => r + 1); }
    else alert("Name bereits vergeben.");
  };

  const handleDeleteCategory = (name: string) => {
    if (!confirm(`Kategorie "${name}" löschen? Produkte behalten ihre aktuelle Kategorie.`)) return;
    deleteCategory(name);
    setRefresh(r => r + 1);
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Produkt endgültig löschen?")) return;
    deleteProduct(id);
    setRefresh(r => r + 1);
  };

  const startEditProduct = (p: typeof products[0]) => {
    setEditingProduct(p.id);
    setEditForm({ title: p.title, description: p.description, price: String(p.price), category: p.category, shipping: p.shipping });
  };

  const handleSaveProduct = (id: string) => {
    const price = parseFloat(editForm.price);
    if (isNaN(price) || price <= 0) { alert("Ungültiger Preis."); return; }
    updateProduct(id, { title: editForm.title, description: editForm.description, price, category: editForm.category, shipping: editForm.shipping });
    setEditingProduct(null);
    setRefresh(r => r + 1);
    alert("✓ Produkt aktualisiert.");
  };

  const handleDeleteUser = (username: string) => {
    if (username === user.username) { alert("Du kannst dich nicht selbst löschen."); return; }
    if (!confirm(`User "${username}" löschen?`)) return;
    deleteUser(username);
    setRefresh(r => r + 1);
  };

  const tabClass = (t: string) => t === tab ? "bm-tab bm-tab-active" : "bm-tab bm-tab-inactive";

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 6, height: 22, background: "hsl(0 70% 50%)", borderRadius: 3 }} />
          <h1 style={{ margin: 0, color: "hsl(0 70% 65%)" }}>Admin Panel</h1>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1 }}>
          {(['overview', 'products', 'categories', 'users'] as const).map(t => (
            <span key={t} className={tabClass(t)} onClick={() => setTab(t)} style={{ cursor: "pointer" }}>
              {t === 'overview' ? '📊 Übersicht' : t === 'products' ? '📦 Produkte' : t === 'categories' ? '🏷 Kategorien' : '👤 Benutzer'}
            </span>
          ))}
        </div>

        <div className="bm-card" style={{ borderTopLeftRadius: 0, padding: 18 }}>
          {tab === 'overview' && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { label: "Benutzer", value: users.length, icon: "👤" },
                { label: "Produkte", value: products.length, icon: "📦" },
                { label: "Kategorien", value: categories.length, icon: "🏷" },
                { label: "Bestellungen", value: orders.length, icon: "🛒" },
                { label: "Aktive Listings", value: products.filter(p => p.active).length, icon: "✅" },
                { label: "Abgeschlossen", value: orders.filter(o => o.status === 'completed').length, icon: "✓" },
              ].map((s, i) => (
                <div key={i} className="bm-card" style={{ textAlign: "center", padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold" }}>{s.value}</div>
                  <div className="bm-dim" style={{ fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'categories' && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input className="bm-form-input" placeholder="Neue Kategorie..." value={newCat} onChange={e => setNewCat(e.target.value)} style={{ maxWidth: 250 }} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                <button className="bm-btn-primary" onClick={handleAddCategory} style={{ width: "auto", padding: "8px 18px" }}>Hinzufügen</button>
              </div>
              <table className="bm-table">
                <thead><tr><th>Kategorie</th><th style={{ width: 80 }}>Produkte</th><th style={{ width: 180 }}>Aktionen</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c}>
                      <td>
                        {editingCat === c ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input className="bm-form-input" value={editCatName} onChange={e => setEditCatName(e.target.value)} style={{ maxWidth: 200 }} onKeyDown={e => e.key === 'Enter' && handleRenameCategory(c)} />
                            <button className="bm-btn-secondary" onClick={() => handleRenameCategory(c)} style={{ fontSize: 11 }}>Speichern</button>
                            <button className="bm-btn-secondary" onClick={() => setEditingCat(null)} style={{ fontSize: 11 }}>×</button>
                          </div>
                        ) : <span style={{ fontWeight: 500 }}>{c}</span>}
                      </td>
                      <td><span className="bm-badge">{products.filter(p => p.category === c).length}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="bm-btn-secondary" onClick={() => { setEditingCat(c); setEditCatName(c); }} style={{ fontSize: 11 }}>Bearbeiten</button>
                          <button className="bm-btn-danger" onClick={() => handleDeleteCategory(c)} style={{ fontSize: 11 }}>Löschen</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'products' && (
            <table className="bm-table">
              <thead><tr><th>Titel</th><th style={{ width: 90 }}>Verkäufer</th><th style={{ width: 70 }}>Preis</th><th style={{ width: 90 }}>Kategorie</th><th style={{ width: 200 }}>Aktionen</th></tr></thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>Keine Produkte.</td></tr>}
                {products.map(p => (
                  editingProduct === p.id ? (
                    <tr key={p.id}>
                      <td colSpan={5}>
                        <div className="bm-card" style={{ padding: 14 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div className="bm-form-group"><label className="bm-form-label">Titel</label><input className="bm-form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                            <div className="bm-form-group"><label className="bm-form-label">Preis (LTC)</label><input className="bm-form-input" type="number" step="0.0001" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></div>
                            <div className="bm-form-group"><label className="bm-form-label">Kategorie</label>
                              <select className="bm-form-input" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                                {categories.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div className="bm-form-group"><label className="bm-form-label">Versand</label><input className="bm-form-input" value={editForm.shipping} onChange={e => setEditForm({...editForm, shipping: e.target.value})} /></div>
                          </div>
                          <div className="bm-form-group"><label className="bm-form-label">Beschreibung</label><textarea className="bm-form-input" style={{ minHeight: 60, resize: "vertical" }} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="bm-btn-primary" onClick={() => handleSaveProduct(p.id)} style={{ width: "auto", padding: "8px 18px" }}>Speichern</button>
                            <button className="bm-btn-secondary" onClick={() => setEditingProduct(null)}>Abbrechen</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.title}</td>
                      <td>{p.seller}</td>
                      <td className="bm-ltc">{p.price}</td>
                      <td><span className="bm-badge">{p.category}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="bm-btn-secondary" onClick={() => startEditProduct(p)} style={{ fontSize: 11 }}>Bearbeiten</button>
                          <button className="bm-btn-danger" onClick={() => handleDeleteProduct(p.id)} style={{ fontSize: 11 }}>Löschen</button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}

          {tab === 'users' && (
            <table className="bm-table">
              <thead><tr><th>Username</th><th style={{ width: 70 }}>Rolle</th><th style={{ width: 70 }}>Guthaben</th><th style={{ width: 60 }}>Sales</th><th style={{ width: 80 }}>Beitritt</th><th style={{ width: 100 }}>Aktion</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td>{u.isAdmin ? <span className="bm-badge" style={{ background: "hsl(0 50% 25%)", color: "hsl(0 70% 70%)" }}>Admin</span> : <span className="bm-badge">User</span>}</td>
                    <td className="bm-ltc">{u.ltcBalance.toFixed(2)}</td>
                    <td>{u.totalSales}</td>
                    <td className="bm-dim" style={{ fontSize: 11 }}>{u.joinDate}</td>
                    <td>
                      {!u.isAdmin && <button className="bm-btn-danger" onClick={() => handleDeleteUser(u.username)} style={{ fontSize: 11 }}>Löschen</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
