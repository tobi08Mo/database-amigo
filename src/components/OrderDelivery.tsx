import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Delivery {
  id: string;
  order_id: string;
  sender: string;
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface Props {
  orderId: string;
  currentUser: string;
  seller: string;
  buyer: string;
}

export default function OrderDelivery({ orderId, currentUser, seller, buyer }: Props) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSeller = currentUser === seller;

  // Load deliveries
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("order_deliveries")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      setDeliveries((data as Delivery[]) || []);
    })();
  }, [orderId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`delivery-${orderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_deliveries",
      }, (payload) => {
        const newItem = payload.new as Delivery;
        if (newItem.order_id === orderId) {
          setDeliveries(prev => {
            if (prev.some(d => d.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deliveries]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    await supabase.from("order_deliveries").insert({
      order_id: orderId,
      sender: currentUser,
      message: message.trim(),
    });
    setMessage("");
  };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${orderId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("delivery-files")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("delivery-files")
        .getPublicUrl(path);

      await supabase.from("order_deliveries").insert({
        order_id: orderId,
        sender: currentUser,
        file_url: urlData.publicUrl,
        file_name: file.name,
      });
    } catch (err: any) {
      alert("Upload-Fehler: " + (err?.message || "Unbekannt"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSend = currentUser === seller || currentUser === buyer;

  return (
    <div style={{ border: "1px solid hsl(0 0% 22%)", background: "hsl(0 0% 13%)", marginTop: 10 }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid hsl(0 0% 22%)", fontSize: 12, fontWeight: 600 }}>
        📦 Digitale Lieferung
      </div>

      {/* Messages area */}
      <div style={{ maxHeight: 300, overflowY: "auto", padding: 12 }}>
        {deliveries.length === 0 && (
          <p className="bm-dim" style={{ fontSize: 11, textAlign: "center", margin: 20 }}>
            {isSeller ? "Sende dem Käufer die digitalen Inhalte hier." : "Warte auf Lieferung vom Verkäufer..."}
          </p>
        )}
        {deliveries.map(d => (
          <div key={d.id} style={{
            marginBottom: 8, padding: "6px 10px",
            background: d.sender === currentUser ? "hsl(0 0% 18%)" : "hsl(0 0% 16%)",
            borderLeft: d.sender === seller ? "3px solid hsl(120 60% 45%)" : "3px solid hsl(200 60% 50%)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: d.sender === seller ? "hsl(120 60% 55%)" : "hsl(200 60% 60%)" }}>
                {d.sender === seller ? "Verkäufer" : "Käufer"}
              </span>
              <span className="bm-dim" style={{ fontSize: 9 }}>
                {new Date(d.created_at).toLocaleString("de-DE")}
              </span>
            </div>
            {d.message && <p style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>{d.message}</p>}
            {d.file_url && (
              <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="bm-link" style={{ fontSize: 12 }}>
                📎 {d.file_name || "Datei herunterladen"}
              </a>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {canSend && (
        <div style={{ borderTop: "1px solid hsl(0 0% 22%)", padding: 8, display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="bm-form-input"
            style={{ flex: 1, fontSize: 12, padding: "6px 8px" }}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Nachricht schreiben..."
          />
          <button className="bm-btn-secondary" onClick={sendMessage} style={{ fontSize: 11, padding: "6px 10px" }}>Senden</button>
          <input type="file" ref={fileRef} onChange={sendFile} style={{ display: "none" }} />
          <button className="bm-btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ fontSize: 11, padding: "6px 10px" }}>
            {uploading ? "..." : "📎"}
          </button>
        </div>
      )}
    </div>
  );
}
