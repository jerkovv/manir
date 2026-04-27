-- Ensure invited/active app users can read their own row (needed for admin panel access check)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App users can read self" ON public.app_users;
CREATE POLICY "App users can read self"
  ON public.app_users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Auto-activate invited users on first login (when they set a password)
CREATE OR REPLACE FUNCTION public.app_user_record_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  UPDATE public.app_users
     SET last_login_at = now(),
         status = CASE WHEN status = 'invited' THEN 'active'::text ELSE status END
   WHERE id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.app_user_record_login() FROM public;
GRANT EXECUTE ON FUNCTION public.app_user_record_login() TO authenticated;

NOTIFY pgrst, 'reload schema';
