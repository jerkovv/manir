-- Guest checkout: dozvoljava anonimnim i ulogovanim korisnicima da kreiraju
-- customer red i da ga pronađu po email adresi tokom checkout-a.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create customer during checkout" ON public.customers;
DROP POLICY IF EXISTS "Anyone can lookup customer by email" ON public.customers;

CREATE POLICY "Anyone can create customer during checkout"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can lookup customer by email"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);
