-- Guest checkout RLS za customers (retry)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to create customer" ON public.customers;
DROP POLICY IF EXISTS "Allow anyone to read customer by email" ON public.customers;

CREATE POLICY "Allow anyone to create customer"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anyone to read customer by email"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);
