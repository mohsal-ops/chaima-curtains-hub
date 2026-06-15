
-- Auto-promote the seeded admin email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'bensa0016@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin_seed ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_seed
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_seed();

-- If admin already exists, promote now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'bensa0016@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
