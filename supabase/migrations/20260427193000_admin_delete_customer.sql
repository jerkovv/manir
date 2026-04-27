-- Security-definer function so admins/owners can delete a customer
-- without needing an edge function. Orders' customer_id is already ON DELETE SET NULL.

create or replace function public.admin_delete_customer(_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _role text;
begin
  if _uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select role into _role from public.app_users where id = _uid;

  if _role is null or _role not in ('owner', 'admin') then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  delete from public.customers where id = _customer_id;
end;
$$;

revoke all on function public.admin_delete_customer(uuid) from public;
grant execute on function public.admin_delete_customer(uuid) to authenticated;
