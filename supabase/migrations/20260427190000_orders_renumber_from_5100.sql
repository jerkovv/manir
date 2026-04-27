-- Renumber existing orders so order_number starts at 5100 (by created_at order)
DO $$
DECLARE
  seq_name text;
  max_num bigint;
BEGIN
  WITH ranked AS (
    SELECT id, 5100 + (ROW_NUMBER() OVER (ORDER BY created_at, id))::int - 1 AS new_num
    FROM public.orders
  )
  UPDATE public.orders o
  SET order_number = r.new_num
  FROM ranked r
  WHERE o.id = r.id;

  SELECT pg_get_serial_sequence('public.orders', 'order_number') INTO seq_name;
  SELECT COALESCE(MAX(order_number), 5099) INTO max_num FROM public.orders;

  IF seq_name IS NOT NULL THEN
    EXECUTE format('SELECT setval(%L, %s, true)', seq_name, GREATEST(max_num, 5099));
  END IF;
END $$;
