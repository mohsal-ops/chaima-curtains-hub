
-- Wilayas: delivery fee + free delivery flag
ALTER TABLE public.wilayas
  ADD COLUMN IF NOT EXISTS delivery_fee_home NUMERIC(10,2) NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS delivery_fee_office NUMERIC(10,2) NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN NOT NULL DEFAULT false;

-- Sensible defaults: Algiers-adjacent wilayas cheaper, remote south higher
UPDATE public.wilayas SET delivery_fee_home = 500, delivery_fee_office = 350 WHERE code IN ('16','35','09','42');
UPDATE public.wilayas SET delivery_fee_home = 700, delivery_fee_office = 450 WHERE code IN ('06','10','15','19','25','26','31','34','36','44','48');
UPDATE public.wilayas SET delivery_fee_home = 1000, delivery_fee_office = 700 WHERE code IN ('01','03','07','08','11','30','32','33','37','39','45','47','49','50','51','52','53','54','55','56','57','58');

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name VARCHAR(120) NOT NULL,
  rating SMALLINT NOT NULL,
  review_text TEXT,
  photo_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.reviews_validate() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF length(NEW.customer_name) < 2 THEN
    RAISE EXCEPTION 'customer_name too short';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS reviews_validate_trg ON public.reviews;
CREATE TRIGGER reviews_validate_trg BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_validate();

DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert a review" ON public.reviews
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews(product_id, created_at DESC);

-- Seed default settings for site-wide chrome (only if missing)
INSERT INTO public.settings (key, value, type, group_name, label)
VALUES
  ('whatsapp_number', '+213561238016', 'string', 'contact', 'WhatsApp number'),
  ('ticker_messages_fr', 'Livraison rapide dans toutes les wilayas|Paiement à la livraison|Visite à domicile gratuite|Garantie qualité sur tous nos produits', 'string', 'chrome', 'Ticker messages (FR)'),
  ('ticker_messages_ar', 'توصيل سريع لجميع الولايات|الدفع عند الاستلام|زيارة منزلية مجانية|ضمان الجودة على جميع منتجاتنا', 'string', 'chrome', 'Ticker messages (AR)'),
  ('social_facebook', '', 'string', 'social', 'Facebook URL'),
  ('social_instagram', '', 'string', 'social', 'Instagram URL'),
  ('social_tiktok', '', 'string', 'social', 'TikTok URL')
ON CONFLICT (key) DO NOTHING;

-- Ensure our 3 core categories exist (idempotent by slug)
INSERT INTO public.categories (name_ar, name_fr, slug, icon, sort_order, is_active) VALUES
  ('السكك', 'Rails', 'rails', '🎯', 1, true),
  ('الإكسسوارات', 'Accessoires', 'accessoires', '✨', 2, true),
  ('الأقمشة', 'Tissus', 'tissus', '🧵', 3, true)
ON CONFLICT (slug) DO NOTHING;
