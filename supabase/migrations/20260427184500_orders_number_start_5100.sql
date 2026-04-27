-- Pomeri order_number sekvencu da sledeći broj bude >= 5100 (WooCommerce-style)
DO $$
DECLARE
  seq_name text;
  current_max bigint;
  target bigint := 5100;
  next_val bigint;
BEGIN
  SELECT pg_get_serial_sequence('public.orders', 'order_number') INTO seq_name;

  IF seq_name IS NULL THEN
    RAISE NOTICE 'No sequence attached to orders.order_number; skipping.';
    RETURN;
  END IF;

  SELECT COALESCE(MAX(order_number), 0) INTO current_max FROM public.orders;

  next_val := GREATEST(target, current_max + 1);

  -- is_called=false znači da će sledeći nextval() vratiti tačno next_val
  EXECUTE format('SELECT setval(%L, %s, false)', seq_name, next_val);
END $$;
