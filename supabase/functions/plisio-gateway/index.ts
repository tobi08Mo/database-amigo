import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLISIO_BASE = "https://plisio.net/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const PLISIO_API_KEY = Deno.env.get("PLISIO_API_KEY");
  if (!PLISIO_API_KEY) {
    return new Response(
      JSON.stringify({ error: "PLISIO_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // CREATE INVOICE — returns wallet address, amount, QR code for white-label
    if (action === "create_invoice") {
      const { amount_eur, username } = body;

      if (!amount_eur || typeof amount_eur !== "number" || amount_eur <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount_eur" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!username || typeof username !== "string" || username.length > 100) {
        return new Response(
          JSON.stringify({ error: "Invalid username" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderNumber = `DEP-${username.substring(0, 50)}-${Date.now()}`;

      const params = new URLSearchParams({
        source_currency: "EUR",
        source_amount: String(amount_eur),
        order_name: `Einzahlung ${amount_eur} EUR`,
        order_number: orderNumber,
        currency: "LTC",
        api_key: PLISIO_API_KEY,
        expire_min: "35",
      });

      const response = await fetch(`${PLISIO_BASE}/invoices/new?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        const errMsg = data.data?.message || data.message || `Plisio API error [${response.status}]`;
        return new Response(
          JSON.stringify({ error: errMsg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const inv = data.data;
      return new Response(
        JSON.stringify({
          success: true,
          txn_id: inv.txn_id,
          invoice_url: inv.invoice_url,
          wallet_address: inv.wallet_hash,
          amount_ltc: inv.amount,
          amount_eur: amount_eur,
          qr_code: inv.qr_code,
          expire_utc: inv.expire_utc,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CHECK INVOICE STATUS
    if (action === "check_status") {
      const { txn_id } = body;
      if (!txn_id || typeof txn_id !== "string" || txn_id.length > 200) {
        return new Response(
          JSON.stringify({ error: "Invalid txn_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({ api_key: PLISIO_API_KEY });
      const response = await fetch(`${PLISIO_BASE}/operations/${encodeURIComponent(txn_id)}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return new Response(
          JSON.stringify({ error: data.data?.message || `Status check failed [${response.status}]` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: data.data.status,
          txn_id: data.data.txn_id,
          amount: data.data.amount,
          pending_amount: data.data.pending_amount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // WITHDRAW
    if (action === "withdraw") {
      const { amount, address, username } = body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!address || typeof address !== "string" || address.length < 10 || address.length > 200) {
        return new Response(
          JSON.stringify({ error: "Invalid LTC address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderNumber = `WD-${(username || "user").substring(0, 50)}-${Date.now()}`;

      const params = new URLSearchParams({
        currency: "LTC",
        amount: String(amount),
        to: address,
        order_number: orderNumber,
        api_key: PLISIO_API_KEY,
        type: "cash_out",
      });

      const response = await fetch(`${PLISIO_BASE}/operations/withdraw?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return new Response(
          JSON.stringify({ error: data.data?.message || `Withdrawal failed [${response.status}]` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, txn_id: data.data?.txn_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // BALANCE
    if (action === "balance") {
      const params = new URLSearchParams({ currency: "LTC", api_key: PLISIO_API_KEY });
      const response = await fetch(`${PLISIO_BASE}/balances?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return new Response(
          JSON.stringify({ error: data.data?.message || "Failed to fetch balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, balance: data.data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: create_invoice, check_status, withdraw, balance" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Plisio gateway error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
