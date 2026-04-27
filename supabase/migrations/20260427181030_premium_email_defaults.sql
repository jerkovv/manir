-- Reset email subjekata i template-a na premium default
UPDATE public.email_settings
SET admin_subject = 'Nova porudžbina #{orderId} — {customerName}',
    customer_subject = 'Potvrda porudžbine #{orderId}',
    customer_template = '',
    admin_template = ''
WHERE id = 1;
