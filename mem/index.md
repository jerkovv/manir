# Project Memory

## Core
Homepage hero must use the generated skincare composition with products.
Current offer should use the original 0202 promo visual below the hero in portrait ratio.
Dates in UI use `sr-Latn-RS` (Latin script) via `src/lib/format.ts` helpers.

## Memories
- [Homepage hero assets](mem://design/homepage-hero-assets.md) — Use hero-skincare as hero; use hero-0202 as current offer below, uncropped portrait.
- [Review RPC params](mem://feature/review-rpc-params.md) — submit_review_by_token uses _author/_comment, never _reviewer_name/_review_text.
- [Schema verification](mem://constraint/schema-verification.md) — Verify RPC signatures via pg_get_function_arguments before writing data-access code.
- [Recovery emails](mem://design/recovery-emails.md)
