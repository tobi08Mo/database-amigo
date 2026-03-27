import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DisputeMsg {
  id: string;
  dispute_id: string;
  sender: string;
  message: string;
  created_at: string;
}

interface Props {
  disputeId: string;
  currentUser: string;
  buyer: string;
  seller: string;
  status: string;
  priceEur: number;
  priceLtc: number;
  isAdmin?: boolean;
  onResolved?: () => void;
}

export default function DisputeChat({ disputeId, currentUser, buyer, seller, status, priceEur, priceLtc, isAdmin, onResolved }: Props) {
  const [messages, setMessages] = useState<DisputeMsg[]>([]);
  const [text, setText] = useState("");
  const [resolving, setResolving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("dispute_messages")
        .select("*")
        .eq("dispute_id", disputeId)
        .order("created_at", { ascending: true });
      setMessages((data as DisputeMsg[]) || []);
    })();
  }, [disputeId]);

  useEffect(() => {
    const channel = supabase
      .channel(`dispute-chat-${disputeId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "dispute_messages",
      }, (payload) => {
        const newMsg = payload.new as DisputeMsg;
        if (newMsg.dispute_id === disputeId) {
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [disputeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || status !== "open") return;
    await supabase.from("dispute_messages" as any).insert({
      dispute_id: disputeId,
      sender: currentUser,
      message: text.trim(),
    });
    setText("");
  };

  const resolve = async (resolution: "buyer" | "seller" | "split") => {
    if (!confirm(`Wirklich ${resolution === "buyer" ? "Käufer bekommt alles zurück" : resolution === "seller" ? "Verkäufer bekommt alles" : "50/50 Aufteilung"}?`)) return;
    setResolving(true);
    try {
      let buyerCredit = 0;
      let sellerCredit = 0;
      if (resolution === "buyer") { buyerCredit = priceLtc; }
      else if (resolution === "seller") { sellerCredit = priceLtc; }
      else { buyerCredit = priceLtc / 2; sellerCredit = priceLtc / 2; }

      // Credit wallets
      if (buyerCredit > 0) {
        await supabase.functions.invoke("wallet-db", {
          body: { action: "credit", username: buyer, amount_ltc: buyerCredit, txn_id: `dispute_refund_${disputeId}` },
        });
      }
      if (sellerCredit > 0) {
        await supabase.functions.invoke("wallet-db", {
          body: { action: "credit", username: seller, amount_ltc: sellerCredit, txn_id: `dispute_pay_${disputeId}` },
        });
      }

      // Update dispute
      await supabase.from("disputes" as any).update({
        status: "resolved",
        resolution,
        resolved_at: new Date().toISOString(),
      }).eq("id", disputeId);

      // Update order status
      const { data: dispute } = await supabase.from("disputes" as any).select("order_id").eq("id", disputeId).single();
      if (dispute) {
        await supabase.from("orders").update({ status: resolution === "buyer" ? "refunded" : "completed" }).eq("id", (dispute as any).order_id);
      }

      // System message
      const resLabel = resolution === "buyer" ? `Käufer (${buyer}) erhält ${buyerCredit.toFixed(4)} LTC zurück` :
        resolution === "seller" ? `Verkäufer (${seller}) erhält ${sellerCredit.toFixed(4)} LTC` :
        `50/50: ${buyer} erhält ${buyerCredit.toFixed(4)} LTC, ${seller} erhält ${sellerCredit.toFixed(4)} LTC`;
      await supabase.from("dispute_messages" as any).insert({
        dispute_id: disputeId,
        sender: "SYSTEM",
        message: `✅ Fall gelöst: ${resLabel}`,
      });

      onResolved?.();
    } catch (err: any) {
      alert("Fehler: " + (err?.message || "Unbekannt"));
    } finally {
      setResolving(false);
    }
  };

  const getSenderLabel = (s: string) => {
    if (s === "SYSTEM") return { name: "System", color: "hsl(48 100% 60%)" };
    if (s === buyer) return { name: `${s} (Käufer)`, color: "hsl(200 60% 60%)" };
    if (s === seller) return { name: `${s} (Verkäufer)`, color: "hsl(120 60% 55%)" };
    return { name: `${s} (Admin)`, color: "hsl(0 70% 65%)" };
  };

  const buyerEur = (priceEur).toFixed(2);
  const sellerEur = (priceEur).toFixed(2);
  const splitEur = (priceEur / 2).toFixed(2);

  return (
    <div style={{ border: "1px solid hsl(0 0% 22%)", background: "hsl(0 0% 11%)", marginTop: 10 }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid hsl(0 0% 22%)", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
        <span>⚖️ Dispute-Chat</span>
        <span style={{ color: status === "open" ? "hsl(48 100% 60%)" : "hsl(120 60% 55%)", fontSize: 11 }}>
          {status === "open" ? "OFFEN" : "GELÖST"}
        </span>
      </div>

      {/* Info bar */}
      <div style={{ padding: "6px 12px", fontSize: 11, background: "hsl(0 0% 13%)", borderBottom: "1px solid hsl(0 0% 20%)" }} className="bm-dim">
        Betrag: {priceEur.toFixed(2)} € / {priceLtc.toFixed(4)} LTC · Käufer: {buyer} · Verkäufer: {seller}
      </div>

      {/* Messages */}
      <div style={{ maxHeight: 300, overflowY: "auto", padding: 12 }}>
        {messages.length === 0 && (
          <p className="bm-dim" style={{ fontSize: 11, textAlign: "center", margin: 20 }}>
            Noch keine Nachrichten im Dispute.
          </p>
        )}
        {messages.map(m => {
          const label = getSenderLabel(m.sender);
          return (
            <div key={m.id} style={{
              marginBottom: 8, padding: "6px 10px",
              background: "hsl(0 0% 15%)",
              borderLeft: `3px solid ${label.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: label.color }}>{label.name}</span>
                <span className="bm-dim" style={{ fontSize: 9 }}>{new Date(m.created_at).toLocaleString("de-DE")}</span>
              </div>
              <p style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>{m.message}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {status === "open" && (
        <div style={{ borderTop: "1px solid hsl(0 0% 22%)", padding: 8, display: "flex", gap: 6 }}>
          <input
            className="bm-form-input"
            style={{ flex: 1, fontSize: 12, padding: "6px 8px" }}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Nachricht schreiben..."
          />
          <button className="bm-btn-secondary" onClick={sendMessage} style={{ fontSize: 11, padding: "6px 10px" }}>Senden</button>
        </div>
      )}

      {/* Admin resolution controls */}
      {isAdmin && status === "open" && (
        <div style={{ borderTop: "1px solid hsl(0 0% 22%)", padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: "hsl(0 70% 65%)" }}>⚖️ Admin-Entscheidung:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              className="bm-btn-primary"
              onClick={() => resolve("buyer")}
              disabled={resolving}
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              💰 Käufer: {buyerEur} € / {priceLtc.toFixed(4)} LTC
            </button>
            <button
              className="bm-btn-accent"
              onClick={() => resolve("seller")}
              disabled={resolving}
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              💰 Verkäufer: {sellerEur} € / {priceLtc.toFixed(4)} LTC
            </button>
            <button
              className="bm-btn-secondary"
              onClick={() => resolve("split")}
              disabled={resolving}
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              ⚖️ 50/50: je {splitEur} € / {(priceLtc / 2).toFixed(4)} LTC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
