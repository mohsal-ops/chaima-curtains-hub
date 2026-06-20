INSERT INTO public.settings (key, value) VALUES
  ('site_logo_url', '/tringle-logo.jpg')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
DELETE FROM public.settings WHERE key IN ('hero_images', 'hero_image_url');