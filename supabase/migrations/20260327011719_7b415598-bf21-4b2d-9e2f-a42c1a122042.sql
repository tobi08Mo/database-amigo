-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text DEFAULT '',
  join_date text DEFAULT '',
  feedback_score numeric DEFAULT 0,
  total_sales integer DEFAULT 0,
  ltc_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, join_date, ltc_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    to_char(now(), 'YYYY-MM-DD'),
    'L' || substr(md5(random()::text), 1, 33)
  );
  INSERT INTO public.wallets (username)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (username) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_my_username()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.profiles WHERE id = auth.uid()
$$;

-- Auto-assign admin role for ADMkz
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username = 'ADMkz' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_check_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

-- Secure wallets
DROP POLICY IF EXISTS "Allow all on wallets" ON public.wallets;
CREATE POLICY "Users read own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (username = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts wallets" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (username = public.get_my_username());
CREATE POLICY "System updates wallets" ON public.wallets
  FOR UPDATE TO authenticated USING (username = public.get_my_username());

-- Secure transactions
DROP POLICY IF EXISTS "Allow all on transactions" ON public.transactions;
CREATE POLICY "Users read own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (username = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));

-- Secure orders
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (buyer = public.get_my_username() OR seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Buyers create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (buyer = public.get_my_username());
CREATE POLICY "Involved update orders" ON public.orders
  FOR UPDATE TO authenticated USING (buyer = public.get_my_username() OR seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));

-- Secure messages
DROP POLICY IF EXISTS "Allow all on messages" ON public.messages;
CREATE POLICY "Users read own messages" ON public.messages
  FOR SELECT TO authenticated USING (from_user = public.get_my_username() OR to_user = public.get_my_username());
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (from_user = public.get_my_username());
CREATE POLICY "Users update received messages" ON public.messages
  FOR UPDATE TO authenticated USING (to_user = public.get_my_username());

-- Secure listings
DROP POLICY IF EXISTS "Allow all on listings" ON public.listings;
CREATE POLICY "Anyone reads listings" ON public.listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sellers create listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (seller = public.get_my_username());
CREATE POLICY "Sellers update own listings" ON public.listings FOR UPDATE TO authenticated USING (seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers delete own listings" ON public.listings FOR DELETE TO authenticated USING (seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));

-- Secure listing_images
DROP POLICY IF EXISTS "Allow all on listing_images" ON public.listing_images;
CREATE POLICY "Anyone reads listing images" ON public.listing_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sellers manage own images" ON public.listing_images FOR INSERT TO authenticated WITH CHECK (listing_id IN (SELECT id FROM public.listings WHERE seller = public.get_my_username()));
CREATE POLICY "Sellers delete own images" ON public.listing_images FOR DELETE TO authenticated USING (listing_id IN (SELECT id FROM public.listings WHERE seller = public.get_my_username()) OR public.has_role(auth.uid(), 'admin'));

-- Secure disputes
DROP POLICY IF EXISTS "Allow all on disputes" ON public.disputes;
CREATE POLICY "Involved read disputes" ON public.disputes FOR SELECT TO authenticated USING (buyer = public.get_my_username() OR seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Buyers create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (buyer = public.get_my_username());
CREATE POLICY "Admins update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Secure dispute_messages
DROP POLICY IF EXISTS "Allow all on dispute_messages" ON public.dispute_messages;
CREATE POLICY "Involved read dispute messages" ON public.dispute_messages FOR SELECT TO authenticated USING (dispute_id IN (SELECT id FROM public.disputes WHERE buyer = public.get_my_username() OR seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Involved send dispute messages" ON public.dispute_messages FOR INSERT TO authenticated WITH CHECK (sender = public.get_my_username() AND dispute_id IN (SELECT id FROM public.disputes WHERE buyer = public.get_my_username() OR seller = public.get_my_username() OR public.has_role(auth.uid(), 'admin')));

-- Secure order_deliveries
DROP POLICY IF EXISTS "Allow all on order_deliveries" ON public.order_deliveries;
CREATE POLICY "Involved read deliveries" ON public.order_deliveries FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM public.orders WHERE buyer = public.get_my_username() OR seller = public.get_my_username()));
CREATE POLICY "Involved send deliveries" ON public.order_deliveries FOR INSERT TO authenticated WITH CHECK (sender = public.get_my_username() AND order_id IN (SELECT id FROM public.orders WHERE buyer = public.get_my_username() OR seller = public.get_my_username()));