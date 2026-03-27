import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

interface Msg {
  id: string;
  from_user: string;
  to_user: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
}

export default function Messages() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prefillTo = params.get("to") || "";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [composing, setComposing] = useState(!!prefillTo);
  const [to, setTo] = useState(prefillTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [loading, setLoading] = useState(true);

  const username = user?.username || "";

  // Load messages
  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user.eq.${username},to_user.eq.${username}`)
        .order("created_at", { ascending: false });
      setMessages((data as Msg[]) || []);
      setLoading(false);
    })();
  }, [username]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${username}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const msg = payload.new as Msg;
        if (msg.from_user === username || msg.to_user === username) {
          setMessages(prev => [msg, ...prev]);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const updated = payload.new as Msg;
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username]);

  const inbox = messages.filter(m => m.to_user === username);
  const sent = messages.filter(m => m.from_user === username);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    if (to === username) { alert("Du kannst dir nicht selbst schreiben."); return; }

    const { error } = await supabase.from("messages").insert({
      from_user: username,
      to_user: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });

    if (error) { alert("Fehler beim Senden."); return; }
    setComposing(false);
    setTo("");
    setSubject("");
    setBody("");
  };

  const openMessage = async (m: Msg) => {
    if (m.to_user === username && !m.read) {
      await supabase.from("messages").update({ read: true }).eq("id", m.id);
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read: true } : x));
    }
    setSelected(m);
    setComposing(false);
  };

  const unreadCount = inbox.filter(m => !m.read).length;

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Nachrichten {unreadCount > 0 && <span className="bm-warn" style={{ fontSize: 13 }}>({unreadCount} neu)</span>}</h1>

        <div className="bm-msg-actions" style={{ marginBottom: 12, display: "flex", gap: 6 }}>
          <button className="bm-btn-accent" onClick={() => { setComposing(true); setSelected(null); }}>+ Neue Nachricht</button>
          <button className="bm-btn-secondary" style={{ opacity: tab === 'inbox' ? 1 : 0.5 }} onClick={() => { setTab('inbox'); setSelected(null); setComposing(false); }}>
            Posteingang ({inbox.length})
          </button>
          <button className="bm-btn-secondary" style={{ opacity: tab === 'sent' ? 1 : 0.5 }} onClick={() => { setTab('sent'); setSelected(null); setComposing(false); }}>
            Gesendet ({sent.length})
          </button>
        </div>

        {composing && (
          <div className="bm-card" style={{ padding: 16, marginBottom: 12 }}>
            <h3>Neue Nachricht</h3>
            <form onSubmit={handleSend}>
              <div className="bm-form-group"><label className="bm-form-label">An</label><input className="bm-form-input" value={to} onChange={e => setTo(e.target.value)} required /></div>
              <div className="bm-form-group"><label className="bm-form-label">Betreff</label><input className="bm-form-input" value={subject} onChange={e => setSubject(e.target.value)} required /></div>
              <div className="bm-form-group"><label className="bm-form-label">Nachricht</label><textarea className="bm-form-input" style={{ minHeight: 80, resize: "vertical" }} value={body} onChange={e => setBody(e.target.value)} required /></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="bm-btn-primary" type="submit" style={{ width: "auto", padding: "8px 20px" }}>Senden</button>
                <button className="bm-btn-secondary" type="button" onClick={() => setComposing(false)}>Abbrechen</button>
              </div>
            </form>
          </div>
        )}

        {selected && (
          <div className="bm-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{selected.subject}</h3>
              <button className="bm-btn-secondary" onClick={() => setSelected(null)} style={{ fontSize: 10 }}>✕ Schließen</button>
            </div>
            <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>
              Von: {selected.from_user} | An: {selected.to_user} | {new Date(selected.created_at).toLocaleString("de-DE")}
            </div>
            <hr className="bm-separator" />
            <p style={{ fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{selected.body}</p>
            <hr className="bm-separator" />
            <button className="bm-btn-secondary" onClick={() => {
              setComposing(true);
              setTo(selected.from_user === username ? selected.to_user : selected.from_user);
              setSubject("RE: " + selected.subject);
              setSelected(null);
            }}>Antworten</button>
          </div>
        )}

        {!composing && !selected && (
          loading ? <p className="bm-dim">Lädt...</p> : (
            <table className="bm-table">
              <thead><tr><th style={{ width: 20 }}></th><th style={{ width: 100 }}>{tab === 'inbox' ? 'Von' : 'An'}</th><th>Betreff</th><th style={{ width: 80 }}>Datum</th></tr></thead>
              <tbody>
                {(tab === 'inbox' ? inbox : sent).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 16 }}>Keine Nachrichten.</td></tr>}
                {(tab === 'inbox' ? inbox : sent).map(m => (
                  <tr key={m.id} onClick={() => openMessage(m)} style={{ cursor: "pointer" }}>
                    <td>{tab === 'inbox' && !m.read ? <span className="bm-warn">●</span> : <span className="bm-dim">○</span>}</td>
                    <td style={{ fontWeight: tab === 'inbox' && !m.read ? "bold" : "normal" }}>{tab === 'inbox' ? m.from_user : m.to_user}</td>
                    <td style={{ fontWeight: tab === 'inbox' && !m.read ? "bold" : "normal" }}>{m.subject}</td>
                    <td className="bm-dim">{new Date(m.created_at).toLocaleDateString("de-DE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
      <RetroFooter />
    </div>
  );
}
