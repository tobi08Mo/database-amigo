
-- Remove permissive policies - service role bypasses RLS anyway
DROP POLICY "Service role full access wallets" ON public.wallets;
DROP POLICY "Service role full access transactions" ON public.transactions;

-- With RLS enabled and no policies, only service_role can access these tables
