import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getCurrentUser, getMessages, sendMessage, markMessageRead, getUsers, Message } from "@/lib/store";

export default function Messages() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prefillTo = params.get("to") || "";
  const [selected, setSelected] = useState<Message | null>(null);
  const [composing, setComposing] = useState(!!prefillTo);
  const [to, setTo] = useState(prefillTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<'inbox'|'sent'>('inbox');

  if (!user) { navigate("/"); return null; }

  const allMessages = getMessages();
  const inbox = allMessages.filter(m => m.to === user.username).sort((a,b) => b.date.localeCompare(a.date));
  const sent = allMessages.filter(m => m.from === user.username).sort((a,b) => b.date.localeCompare(a.date));

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getUsers().find(u => u.username === to)) { alert("Benutzer nicht gefunden."); return; }
    if (to === user.username) { alert("Du kannst dir nicht selbst schreiben."); return; }
    sendMessage(user.username, to, subject, body);
    alert("✓ Nachricht an " + to + " gesendet.");
    setComposing(false); setTo(""); setSubject(""); setBody("");
    window.location.reload();
  };

  const openMessage = (m: Message) => {
    if (m.to === user.username && !m.read) markMessageRead(m.id);
    setSelected(m);
    setComposing(false);
  };

  return (
    <div className="bm-bg" style={{ minHeight: "100vh" }}>
      <RetroHeader />
      <div className="bm-page">
        <h1>Nachrichten</h1>
        <div className="bm-msg-actions" style={{ marginBottom: 12, display: "flex", gap: 6 }}>
          <button className="bm-btn-accent" onClick={() => { setComposing(true); setSelected(null); }}>+ Neue Nachricht</button>
          <button className={tab==='inbox'?"bm-btn-secondary":"bm-btn-secondary"} style={{ opacity: tab==='inbox'?1:0.5 }} onClick={() => { setTab('inbox'); setSelected(null); setComposing(false); }}>Posteingang ({inbox.length})</button>
          <button className="bm-btn-secondary" style={{ opacity: tab==='sent'?1:0.5 }} onClick={() => { setTab('sent'); setSelected(null); setComposing(false); }}>Gesendet ({sent.length})</button>
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
            <div className="bm-dim" style={{ fontSize: 10, marginTop: 4 }}>Von: {selected.from} | An: {selected.to} | {selected.date}</div>
            <hr className="bm-separator" />
            <p style={{ fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{selected.body}</p>
            <hr className="bm-separator" />
            <button className="bm-btn-secondary" onClick={() => { setComposing(true); setTo(selected.from===user.username?selected.to:selected.from); setSubject("RE: "+selected.subject); setSelected(null); }}>Antworten</button>
          </div>
        )}

        {!composing && !selected && (
          <table className="bm-table">
            <thead><tr><th style={{ width: 20 }}></th><th style={{ width: 100 }}>{tab==='inbox'?'Von':'An'}</th><th>Betreff</th><th style={{ width: 80 }}>Datum</th></tr></thead>
            <tbody>
              {(tab==='inbox'?inbox:sent).length===0&&<tr><td colSpan={4} style={{ textAlign: "center", padding: 16 }}>Keine Nachrichten.</td></tr>}
              {(tab==='inbox'?inbox:sent).map(m=>(
                <tr key={m.id} onClick={()=>openMessage(m)} style={{ cursor: "pointer" }}>
                  <td>{tab==='inbox'&&!m.read?<span className="bm-warn">●</span>:<span className="bm-dim">○</span>}</td>
                  <td style={{ fontWeight: tab==='inbox'&&!m.read?"bold":"normal" }}>{tab==='inbox'?m.from:m.to}</td>
                  <td style={{ fontWeight: tab==='inbox'&&!m.read?"bold":"normal" }}>{m.subject}</td>
                  <td className="bm-dim">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <RetroFooter />
    </div>
  );
}
