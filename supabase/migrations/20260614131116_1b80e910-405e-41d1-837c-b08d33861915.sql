
-- =====================================================
-- ROLES
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =====================================================
-- TIMESTAMP HELPER
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =====================================================
-- WILAYAS
-- =====================================================
CREATE TABLE public.wilayas (
  id serial PRIMARY KEY,
  code varchar(2) NOT NULL UNIQUE,
  name_ar varchar(100) NOT NULL,
  name_fr varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read wilayas" ON public.wilayas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage wilayas" ON public.wilayas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- CITIES
-- =====================================================
CREATE TABLE public.cities (
  id serial PRIMARY KEY,
  wilaya_id integer NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  name_ar varchar(100) NOT NULL,
  name_fr varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cities_wilaya ON public.cities(wilaya_id);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cities" ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage cities" ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar varchar(100) NOT NULL,
  name_fr varchar(100) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  icon varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar varchar(255) NOT NULL,
  name_fr varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  description_ar text,
  description_fr text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  meta_title_ar varchar(255),
  meta_title_fr varchar(255),
  meta_desc_ar varchar(300),
  meta_desc_fr varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id, sort_order);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- ORDERS
-- =====================================================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number varchar(20) NOT NULL UNIQUE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_snapshot jsonb NOT NULL,
  customer_name varchar(100) NOT NULL,
  customer_phone varchar(20) NOT NULL,
  customer_email varchar(255),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  delivery_type varchar(10) NOT NULL CHECK (delivery_type IN ('home','office')),
  wilaya_id integer REFERENCES public.wilayas(id),
  city_id integer REFERENCES public.cities(id),
  address text,
  notes text,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','in_delivery','delivered','cancelled')),
  cancelled_reason text,
  admin_notes text,
  ip_address varchar(45),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- ORDER STATUS HISTORY
-- =====================================================
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status varchar(20),
  new_status varchar(20) NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_osh_order ON public.order_status_history(order_id, created_at DESC);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage status history" ON public.order_status_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- APPOINTMENTS
-- =====================================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number varchar(20) NOT NULL UNIQUE,
  customer_name varchar(100) NOT NULL,
  customer_phone varchar(20) NOT NULL,
  customer_email varchar(255),
  wilaya_id integer REFERENCES public.wilayas(id),
  city_id integer REFERENCES public.cities(id),
  preferred_date date NOT NULL,
  window_count integer NOT NULL DEFAULT 1,
  description text,
  travel_cost numeric(10,2) DEFAULT 3000.00,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','visited','cancelled')),
  confirmed_date date,
  admin_notes text,
  ip_address varchar(45),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appts_status ON public.appointments(status);
CREATE INDEX idx_appts_date ON public.appointments(preferred_date);
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can book appointment" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read appts" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update appts" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete appts" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_appts_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- SETTINGS
-- =====================================================
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(100) NOT NULL UNIQUE,
  value text,
  type varchar(20) NOT NULL DEFAULT 'text',
  group_name varchar(50),
  label varchar(255),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- ORDER NUMBER GENERATION (RPC)
-- =====================================================
CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  cnt int;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt FROM public.orders
  WHERE created_at >= date_trunc('year', now());
  RETURN 'CR-' || yr || '-' || lpad(cnt::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.next_appointment_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  cnt int;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt FROM public.appointments
  WHERE created_at >= date_trunc('year', now());
  RETURN 'AP-' || yr || '-' || lpad(cnt::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_appointment_number() TO anon, authenticated;
