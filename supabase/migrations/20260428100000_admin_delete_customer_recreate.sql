-- Recreate admin_delete_customer to ensure it exists in schema cache
DROP FUNCTION IF EXISTS public.admin_delete_customer(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_customer(_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '42501';
  END IF;

  SELECT role INTO _role FROM public.app_users WHERE id = _uid;

  IF _role IS NULL OR _role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient privileges' USING errcode = '42501';
  END IF;

  DELETE FROM public.customers WHERE id = _customer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_customer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_customer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
