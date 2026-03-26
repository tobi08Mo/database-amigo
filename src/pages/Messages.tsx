import { useState, useEffect } from "react";
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
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');

  if (!user) { navigate("/login"); return null; }

  const allMessages = getMessages();
  const inbox = allMessages.filter(m => m.to === user.username).sort((a, b) => b.date.localeCompare(a.date));
  const sent = allMessages.filter(m => m.from === user.username).sort((a, b) => b.date.localeCompare(a.date));

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getUsers().find(u => u.username === to)) { alert("ERROR: User not found."); return; }
    if (to === user.username) { alert("ERROR: Cannot message yourself."); return; }
    sendMessage(user.username, to, subject, body);
    alert("✓ Message sent to " + to);
    setComposing(false); setTo(""); setSubject(""); setBody("");
    window.location.reload();
  };

  const openMessage = (m: Message) => {
    if (m.to === user.username && !m.read) markMessageRead(m.id);
    setSelected(m);
    setComposing(false);
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <h1>✉ MESSAGES</h1>
        <div style={{ marginBottom: 10 }}>
          <button className="retro-btn" onClick={() => { setComposing(true); setSelected(null); }} style={{ marginRight: 8 }}>+ COMPOSE</button>
          <button className="retro-btn" onClick={() => { setTab('inbox'); setSelected(null); setComposing(false); }} style={{ marginRight: 4, opacity: tab === 'inbox' ? 1 : 0.5 }}>INBOX ({inbox.length})</button>
          <button className="retro-btn" onClick={() => { setTab('sent'); setSelected(null); setComposing(false); }} style={{ opacity: tab === 'sent' ? 1 : 0.5 }}>SENT ({sent.length})</button>
        </div>

        {composing && (
          <div className="retro-card" style={{ padding: 14, marginBottom: 10 }}>
            <h3>COMPOSE MESSAGE</h3>
            <form onSubmit={handleSend}>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr><td style={{ width: 70, fontSize: 11, fontFamily: "Verdana" }}>To:</td><td><input className="retro-input" value={to} onChange={e => setTo(e.target.value)} required /></td></tr>
                  <tr><td style={{ fontSize: 11, fontFamily: "Verdana" }}>Subject:</td><td><input className="retro-input" value={subject} onChange={e => setSubject(e.target.value)} required /></td></tr>
                  <tr><td style={{ fontSize: 11, fontFamily: "Verdana", verticalAlign: "top" }}>Body:</td><td><textarea className="retro-textarea" rows={5} value={body} onChange={e => setBody(e.target.value)} required /></td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 8 }}>
                <button className="retro-btn retro-btn-accent" type="submit">SEND</button>
                <button className="retro-btn" type="button" onClick={() => setComposing(false)} style={{ marginLeft: 8 }}>CANCEL</button>
              </div>
            </form>
          </div>
        )}

        {selected && (
          <div className="retro-card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>{selected.subject}</h3>
              <button className="retro-btn" onClick={() => setSelected(null)} style={{ fontSize: 9 }}>✕ CLOSE</button>
            </div>
            <div className="text-dim" style={{ fontSize: 9, marginBottom: 8 }}>
              From: {selected.from} | To: {selected.to} | Date: {selected.date}
            </div>
            <hr className="retro-separator" />
            <p style={{ fontSize: 11, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selected.body}</p>
            <hr className="retro-separator" />
            <button className="retro-btn" onClick={() => { setComposing(true); setTo(selected.from === user.username ? selected.to : selected.from); setSubject("RE: " + selected.subject); setSelected(null); }}>REPLY</button>
          </div>
        )}

        {!composing && !selected && (
          <table className="retro-table">
            <thead>
              <tr>
                <th style={{ width: 20 }}></th>
                <th style={{ width: 100 }}>{tab === 'inbox' ? 'FROM' : 'TO'}</th>
                <th>SUBJECT</th>
                <th style={{ width: 80 }}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {(tab === 'inbox' ? inbox : sent).length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 16 }}>No messages.</td></tr>
              )}
              {(tab === 'inbox' ? inbox : sent).map(m => (
                <tr key={m.id} onClick={() => openMessage(m)} style={{ cursor: "pointer" }}>
                  <td>{tab === 'inbox' && !m.read ? <span className="retro-blink text-warn">●</span> : <span className="text-dim">○</span>}</td>
                  <td style={{ fontWeight: tab === 'inbox' && !m.read ? "bold" : "normal" }}>{tab === 'inbox' ? m.from : m.to}</td>
                  <td style={{ fontWeight: tab === 'inbox' && !m.read ? "bold" : "normal" }}>{m.subject}</td>
                  <td className="text-dim">{m.date}</td>
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
