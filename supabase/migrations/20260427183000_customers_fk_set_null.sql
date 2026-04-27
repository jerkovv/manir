-- Allow customer deletion by setting orders.customer_id to NULL on delete
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.orders'::regclass
    AND contype = 'f'
    AND confrelid = 'public.customers'::regclass;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
