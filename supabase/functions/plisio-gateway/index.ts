import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    if (action === "create_invoice") {
      const { amount, currency, order_name, order_number } = body;

      if (!amount || !currency || !order_name || !order_number) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: amount, currency, order_name, order_number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        source_currency: currency,
        source_amount: String(amount),
        order_name: order_name,
        order_number: order_number,
        currency: "LTC",
        api_key: PLISIO_API_KEY,
      });

      const response = await fetch(
        `https://plisio.net/api/v1/invoices/new?${params.toString()}`
      );
      const data = await response.json();

      if (data.status === "success" && data.data?.invoice_url) {
        return new Response(
          JSON.stringify({
            success: true,
            invoice_url: data.data.invoice_url,
            txn_id: data.data.txn_id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: data.data?.message || "Failed to create invoice" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "withdraw") {
      const { amount, currency, address, order_number } = body;

      if (!amount || !currency || !address || !order_number) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: amount, currency, address, order_number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        currency: "LTC",
        amount: String(amount),
        to: address,
        order_number: order_number,
        api_key: PLISIO_API_KEY,
        type: "cash_out",
      });

      const response = await fetch(
        `https://plisio.net/api/v1/operations/withdraw?${params.toString()}`
      );
      const data = await response.json();

      if (data.status === "success") {
        return new Response(
          JSON.stringify({
            success: true,
            txn_id: data.data?.txn_id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: data.data?.message || "Withdrawal failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "balance") {
      const params = new URLSearchParams({
        currency: "LTC",
        api_key: PLISIO_API_KEY,
      });

      const response = await fetch(
        `https://plisio.net/api/v1/balances?${params.toString()}`
      );
      const data = await response.json();

      if (data.status === "success") {
        return new Response(
          JSON.stringify({ success: true, balance: data.data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: data.data?.message || "Failed to fetch balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: create_invoice, withdraw, balance" }),
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
