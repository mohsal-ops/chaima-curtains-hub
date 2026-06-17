INSERT INTO public.settings (key, value) VALUES
  ('site_name_ar', 'ترينقل أكسسوار'),
  ('site_name_fr', 'Tringle Accessoires'),
  ('site_logo_url', '/__l5e/assets-v1/2470ff1a-8106-46fe-9e1e-43879c4ac535/tringle-logo.jpg'),
  ('hero_images', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&q=80,https://images.unsplash.com/photo-1616627052149-22c4f8a6316e?w=1920&q=80,https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();