
-- Wallets table: stores user balances
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  ltc_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table: stores all deposits and withdrawals
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale')),
  amount_ltc NUMERIC NOT NULL,
  amount_eur NUMERIC,
  txn_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_transactions_username ON public.transactions(username);
CREATE INDEX idx_transactions_txn_id ON public.transactions(txn_id);

-- Disable RLS since app uses custom auth (not Supabase Auth)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access
CREATE POLICY "Service role full access wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
