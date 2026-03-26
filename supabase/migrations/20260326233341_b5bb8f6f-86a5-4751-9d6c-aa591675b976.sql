
-- Listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_eur NUMERIC NOT NULL,
  price_ltc NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'Digital Goods',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Listing images table
CREATE TABLE public.listing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  product_title TEXT NOT NULL,
  price_eur NUMERIC NOT NULL,
  price_ltc NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'escrow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order deliveries table (seller sends text/files to buyer)
CREATE TABLE public.order_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL,
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for order_deliveries
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_deliveries;

-- Disable RLS for now (app uses username-based auth, not Supabase auth)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no Supabase auth used)
CREATE POLICY "Allow all on listings" ON public.listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on listing_images" ON public.listing_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on order_deliveries" ON public.order_deliveries FOR ALL USING (true) WITH CHECK (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-files', 'delivery-files', true);

-- Storage policies
CREATE POLICY "Anyone can upload listing images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images');
CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Anyone can upload delivery files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'delivery-files');
CREATE POLICY "Anyone can view delivery files" ON storage.objects FOR SELECT USING (bucket_id = 'delivery-files');
