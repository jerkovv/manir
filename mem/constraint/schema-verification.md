---
name: Supabase schema verification before Phase 3b
description: Verify exact Supabase table and RPC column names before writing Phase 3b code.
type: constraint
---
Before writing any Phase 3b code that reads or writes Supabase tables or RPCs, verify the exact live schema first using available Supabase schema access or Table Editor details. Do not infer column or parameter names from earlier context.

Why: This project has had repeated schema mismatches in abandoned cart and recovery flows.