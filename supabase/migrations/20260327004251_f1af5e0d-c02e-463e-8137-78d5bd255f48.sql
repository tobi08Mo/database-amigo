
-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on disputes" ON public.disputes FOR ALL TO public USING (true) WITH CHECK (true);

-- Dispute messages table
CREATE TABLE public.dispute_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on dispute_messages" ON public.dispute_messages FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispute_messages;
