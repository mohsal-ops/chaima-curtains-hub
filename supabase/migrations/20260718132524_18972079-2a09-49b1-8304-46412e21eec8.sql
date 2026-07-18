ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[];
-- Seed default curtain-rail sizes (in meters) for existing products that have no sizes set
UPDATE public.products
SET sizes = ARRAY['1m','1.50m','1.75m','2m','2.50m','3m','3.50m','4m','4.50m','6m']
WHERE sizes = '{}'::text[];