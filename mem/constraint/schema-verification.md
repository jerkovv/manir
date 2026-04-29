---
name: Supabase schema verification before Phase 3b
description: Verify exact Supabase table and RPC column names before writing Phase 3b code.
type: constraint
---
Before writing any code that reads or writes Supabase tables or RPCs, verify the exact live schema first. For RPCs, run `pg_get_function_arguments` (or check pg_proc) to confirm parameter names — do not infer from earlier context or related functions.

Why: This project has had 3+ schema mismatches (abandoned cart, recovery, reviews). Top source of bugs.