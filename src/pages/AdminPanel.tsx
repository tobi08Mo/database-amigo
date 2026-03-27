import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isCurrentUserAdmin, getCategories, addCategory, renameCategory, deleteCategory, getUsers } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import DisputeChat from "@/components/DisputeChat";

interface DbListing {
  id: string;
  title: string;
  description: string;
  price_eur: number;
  price_ltc: number;
  category: string;
  seller: string;
  active: boolean;
  created_at: string;
}

interface DbOrder {
  id: string;
  product_title: string;
  buyer: string;
  seller: string;
  status: string;
  price_eur: number;
  price_ltc: number;
  created_at: string;
}

interface DbWallet {
  username: string;
  ltc_balance: number;
  created_at: string;
}

interface DbDispute {
  id: string;
  order_id: string;
  buyer: string;
  seller: string;
  reason: string;
  status: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export default function AdminPanel() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'categories' | 'users' | 'overview' | 'disputes'>('overview');
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price_eur: "", category: "" });
  const [, setRefresh] = useState(0);

  const [listings, setListings] = useState<DbListing[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [wallets, setWallets] = useState<DbWallet[]>([]);
  const [allDisputes, setAllDisputes] = useState<DbDispute[]>([]);
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = getCategories();
  const localUsers = getUsers();

  useEffect(() => {
    if (!user || !isCurrentUserAdmin()) { navigate("/home"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [listingsRes, ordersRes, walletsRes, disputesRes] = await Promise.all([
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("wallets").select("username, ltc_balance"),
      supabase.from("disputes" as any).select("*").order("created_at", { ascending: false }),
    ]);
    if (listingsRes.data) setListings(listingsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (walletsRes.data) setWallets(walletsRes.data);
    if (disputesRes.data) setAllDisputes(disputesRes.data as DbDispute[]);
    setLoading(false);
  };

  if (!user || !isCurrentUserAdmin()) return null;

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
    if (!confirm(`Kategorie "${name}" löschen?`)) return;
    deleteCategory(name);
    setRefresh(r => r + 1);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Produkt endgültig löschen?")) return;
    await supabase.from("listing_images").delete().eq("listing_id", id);
    await supabase.from("listings").delete().eq("id", id);
    setListings(prev => prev.filter(p => p.id !== id));
  };

  const startEditProduct = (p: DbListing) => {
    setEditingProduct(p.id);
    setEditForm({ title: p.title, description: p.description, price_eur: String(p.price_eur), category: p.category });
  };

  const handleSaveProduct = async (id: string) => {
    const price_eur = parseFloat(editForm.price_eur);
    if (isNaN(price_eur) || price_eur <= 0) { alert("Ungültiger Preis."); return; }
    const { error } = await supabase.from("listings").update({
      title: editForm.title,
      description: editForm.description,
      price_eur,
      category: editForm.category,
    }).eq("id", id);
    if (error) { alert("Fehler: " + error.message); return; }
    setListings(prev => prev.map(p => p.id === id ? { ...p, title: editForm.title, description: editForm.description, price_eur, category: editForm.category } : p));
    setEditingProduct(null);
    alert("✓ Produkt aktualisiert.");
  };

  const getWalletBalance = (username: string) => {
    const w = wallets.find(w => w.username === username);
    return w ? w.ltc_balance : 0;
  };

  const tabClass = (t: string) => t === tab ? "bm-tab bm-tab-active" : "bm-tab bm-tab-inactive";

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 6, height: 22, background: "hsl(0 70% 50%)" }} />
          <h1 style={{ margin: 0, color: "hsl(0 70% 65%)" }}>Admin Panel</h1>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: -1, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {(['overview', 'disputes', 'products', 'categories', 'users'] as const).map(t => (
            <span key={t} className={tabClass(t)} onClick={() => setTab(t)} style={{ cursor: "pointer", position: "relative" }}>
              {t === 'overview' ? '📊 Übersicht' : t === 'disputes' ? '⚖️ Disputes' : t === 'products' ? '📦 Produkte' : t === 'categories' ? '🏷 Kategorien' : '👤 Benutzer'}
              {t === 'disputes' && allDisputes.filter(d => d.status === 'open').length > 0 && (
                <span style={{ background: "hsl(0 70% 50%)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
                  {allDisputes.filter(d => d.status === 'open').length}
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="bm-card" style={{ borderTopLeftRadius: 0, padding: 18 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }} className="bm-dim">Lade Daten...</div>
          ) : (
            <>
              {tab === 'overview' && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Benutzer", value: localUsers.length, icon: "👤" },
                    { label: "Produkte", value: listings.length, icon: "📦" },
                    { label: "Kategorien", value: categories.length, icon: "🏷" },
                    { label: "Bestellungen", value: orders.length, icon: "🛒" },
                    { label: "Aktive Listings", value: listings.filter(p => p.active).length, icon: "✅" },
                    { label: "Abgeschlossen", value: orders.filter(o => o.status === 'completed').length, icon: "✓" },
                    { label: "Offene Disputes", value: allDisputes.filter(d => d.status === 'open').length, icon: "⚖️" },
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
                          <td><span className="bm-badge">{listings.filter(p => p.category === c).length}</span></td>
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
                  <thead><tr><th>Titel</th><th style={{ width: 90 }}>Verkäufer</th><th style={{ width: 70 }}>Preis €</th><th style={{ width: 90 }}>Kategorie</th><th style={{ width: 200 }}>Aktionen</th></tr></thead>
                  <tbody>
                    {listings.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>Keine Produkte.</td></tr>}
                    {listings.map(p => (
                      editingProduct === p.id ? (
                        <tr key={p.id}>
                          <td colSpan={5}>
                            <div className="bm-card" style={{ padding: 14 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div className="bm-form-group"><label className="bm-form-label">Titel</label><input className="bm-form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                                <div className="bm-form-group"><label className="bm-form-label">Preis (EUR)</label><input className="bm-form-input" type="number" step="0.01" value={editForm.price_eur} onChange={e => setEditForm({...editForm, price_eur: e.target.value})} /></div>
                                <div className="bm-form-group"><label className="bm-form-label">Kategorie</label>
                                  <select className="bm-form-input" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                  </select>
                                </div>
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
                          <td>{p.price_eur.toFixed(2)} €</td>
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
                  <thead><tr><th>Username</th><th style={{ width: 70 }}>Rolle</th><th style={{ width: 90 }}>Guthaben (LTC)</th><th style={{ width: 80 }}>Beitritt</th></tr></thead>
                  <tbody>
                    {localUsers.map(u => (
                      <tr key={u.username}>
                        <td style={{ fontWeight: 500 }}>{u.username}</td>
                        <td>{u.isAdmin ? <span className="bm-badge" style={{ background: "hsl(0 50% 25%)", color: "hsl(0 70% 70%)" }}>Admin</span> : <span className="bm-badge">User</span>}</td>
                        <td className="bm-ltc">{getWalletBalance(u.username).toFixed(4)}</td>
                        <td className="bm-dim" style={{ fontSize: 11 }}>{u.joinDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'disputes' && (
                <>
                  <h2 style={{ color: "hsl(0 70% 65%)" }}>⚖️ Dispute-Fälle</h2>
                  {allDisputes.length === 0 && <p className="bm-dim" style={{ textAlign: "center" }}>Keine Disputes.</p>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {allDisputes.map(d => {
                      const order = orders.find(o => o.id === d.order_id);
                      return (
                        <div key={d.id} className="bm-card" style={{
                          padding: 14,
                          borderLeft: d.status === 'open' ? "3px solid hsl(0 70% 50%)" : "3px solid hsl(120 60% 40%)",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {order?.product_title || "Unbekannt"}
                                <span style={{
                                  marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 6px",
                                  background: d.status === 'open' ? "hsl(0 50% 20%)" : "hsl(120 40% 18%)",
                                  color: d.status === 'open' ? "hsl(0 70% 65%)" : "hsl(120 60% 55%)",
                                }}>
                                  {d.status === 'open' ? 'OFFEN' : 'GELÖST'}
                                </span>
                                {d.resolution && (
                                  <span style={{ marginLeft: 6, fontSize: 10, color: "hsl(0 0% 60%)" }}>
                                    ({d.resolution === 'buyer' ? 'Käufer erstattet' : d.resolution === 'seller' ? 'Verkäufer bezahlt' : '50/50'})
                                  </span>
                                )}
                              </div>
                              <div className="bm-dim" style={{ fontSize: 11, marginTop: 2 }}>
                                Käufer: {d.buyer} · Verkäufer: {d.seller} · {order ? `${order.price_eur.toFixed(2)} €` : ''} · {new Date(d.created_at).toLocaleString("de-DE")}
                              </div>
                              <div style={{ fontSize: 11, marginTop: 4, fontStyle: "italic" }} className="bm-dim">
                                Grund: "{d.reason}"
                              </div>
                            </div>
                            <button
                              className="bm-btn-secondary"
                              onClick={() => setExpandedDispute(expandedDispute === d.id ? null : d.id)}
                              style={{ fontSize: 11 }}
                            >
                              {expandedDispute === d.id ? "Schließen" : "💬 Chat öffnen"}
                            </button>
                          </div>
                          {expandedDispute === d.id && order && (
                            <DisputeChat
                              disputeId={d.id}
                              currentUser={user!.username}
                              buyer={d.buyer}
                              seller={d.seller}
                              status={d.status}
                              priceEur={order.price_eur}
                              priceLtc={order.price_ltc}
                              isAdmin={true}
                              onResolved={loadData}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
