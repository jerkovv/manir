CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = _user_id AND role IN ('owner','admin','editor') AND status = 'active'
  );
$$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins select all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete all orders" ON public.orders;
CREATE POLICY "Admins select all orders" ON public.orders FOR SELECT TO authenticated USING (public.is_app_admin(auth.uid()));
CREATE POLICY "Admins update all orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "Admins delete all orders" ON public.orders FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins select all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins update all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins delete all order_items" ON public.order_items;
CREATE POLICY "Admins select all order_items" ON public.order_items FOR SELECT TO authenticated USING (public.is_app_admin(auth.uid()));
CREATE POLICY "Admins update all order_items" ON public.order_items FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "Admins delete all order_items" ON public.order_items FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins delete all customers" ON public.customers;
CREATE POLICY "Admins update all customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "Admins delete all customers" ON public.customers FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()));
