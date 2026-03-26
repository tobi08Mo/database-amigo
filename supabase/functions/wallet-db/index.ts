import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { action, username } = body;

    if (!username || typeof username !== "string" || username.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid username" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET OR CREATE WALLET
    if (action === "get_balance") {
      // Upsert wallet (create if not exists)
      const { data: wallet, error } = await supabase
        .from("wallets")
        .upsert({ username, ltc_balance: 0 }, { onConflict: "username", ignoreDuplicates: true })
        .select()
        .single();

      if (error) {
        // If upsert fails, try select
        const { data: existing } = await supabase
          .from("wallets")
          .select("*")
          .eq("username", username)
          .single();

        if (existing) {
          // Get recent transactions
          const { data: txns } = await supabase
            .from("transactions")
            .select("*")
            .eq("username", username)
            .order("created_at", { ascending: false })
            .limit(50);

          return new Response(
            JSON.stringify({ success: true, balance: Number(existing.ltc_balance), transactions: txns || [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      const { data: txns } = await supabase
        .from("transactions")
        .select("*")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({ success: true, balance: Number(wallet.ltc_balance), transactions: txns || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREDIT — add funds after confirmed deposit
    if (action === "credit") {
      const { amount_ltc, amount_eur, txn_id, wallet_address } = body;
      if (!amount_ltc || amount_ltc <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this txn_id was already credited (prevent double-credit)
      if (txn_id) {
        const { data: existing } = await supabase
          .from("transactions")
          .select("id")
          .eq("txn_id", txn_id)
          .eq("type", "deposit")
          .eq("status", "completed")
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ success: true, already_credited: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Ensure wallet exists
      await supabase
        .from("wallets")
        .upsert({ username, ltc_balance: 0 }, { onConflict: "username", ignoreDuplicates: true });

      // Get current balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("ltc_balance")
        .eq("username", username)
        .single();

      const currentBalance = Number(wallet?.ltc_balance || 0);
      const newBalance = currentBalance + Number(amount_ltc);

      // Update balance
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ ltc_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("username", username);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        username,
        type: "deposit",
        amount_ltc: Number(amount_ltc),
        amount_eur: amount_eur ? Number(amount_eur) : null,
        txn_id: txn_id || null,
        status: "completed",
        wallet_address: wallet_address || null,
      });

      return new Response(
        JSON.stringify({ success: true, new_balance: newBalance }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DEBIT — subtract funds for withdrawal or purchase
    if (action === "debit") {
      const { amount_ltc, amount_eur, txn_id, type: txType } = body;
      if (!amount_ltc || amount_ltc <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("ltc_balance")
        .eq("username", username)
        .single();

      if (!wallet) {
        return new Response(
          JSON.stringify({ error: "Wallet not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentBalance = Number(wallet.ltc_balance);
      if (currentBalance < Number(amount_ltc)) {
        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newBalance = currentBalance - Number(amount_ltc);

      const { error: updateError } = await supabase
        .from("wallets")
        .update({ ltc_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("username", username);

      if (updateError) throw updateError;

      await supabase.from("transactions").insert({
        username,
        type: txType || "withdrawal",
        amount_ltc: Number(amount_ltc),
        amount_eur: amount_eur ? Number(amount_eur) : null,
        txn_id: txn_id || null,
        status: "completed",
      });

      return new Response(
        JSON.stringify({ success: true, new_balance: newBalance }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: get_balance, credit, debit" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Wallet DB error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
