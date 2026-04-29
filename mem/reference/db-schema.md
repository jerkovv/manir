---
name: Authoritative DB column names
description: Exact column names for Supabase tables. Use these names verbatim — never infer naming style.
type: reference
---
Verified against `information_schema.columns`. When in doubt, query the schema before writing code.

## abandoned_carts
- `id`, `email`, `customer_name`, `status`, `source`
- `cart_data` (jsonb), `cart_total` (numeric)
- `created_at`, `updated_at`
- `email1_sent_at`, `email2_sent_at`  ← NO underscore between "email" and digit
- `converted_at`, `unsubscribed_at`
- `recovery_token`

## recovery_settings (id=1 singleton)
- `abandoned_cart_enabled`, `email1_delay_minutes`, `email2_delay_hours`  ← same pattern, no underscore before digit

## orders (review-related)
- `review_email_sent` (bool), `customer_email`, `status`, `created_at`

Rule: column names that pair a word with a digit (`email1`, `email2`, `delay1`) do NOT use an underscore separator. Past regressions: 4× across phases 3b-1, 3b-2b, 3b-3a.