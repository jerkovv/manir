# Project Memory

## Core
Homepage hero must use the generated skincare composition with products.
Current offer should use the original 0202 promo visual below the hero in portrait ratio.
DB column names that pair word+digit use no underscore separator (e.g. `email1_sent_at`, NOT `email_1_sent_at`).
Email subject lines MUST NOT contain `?` if they include non-ASCII chars (č, š, ž, ć, đ, ·) — denomailer Q-encoding breaks in Apple Mail. Rephrase to a statement.

## Memories
- [Homepage hero assets](mem://design/homepage-hero-assets.md) — Use hero-skincare as hero; use hero-0202 as current offer below, uncropped portrait.
- [DB schema column names](mem://reference/db-schema.md) — Authoritative column names per table; check before writing queries.
- [Schema verification](mem://constraint/schema-verification.md) — Always verify schema in information_schema before assuming column names.
- [SMTP encoding rules](mem://design/email-encoding.md) — Body 8bit (not QP); Subject Q-encoded OK but NEVER contains `?` with non-ASCII.
- [Recovery emails](mem://design/recovery-emails.md) — Recovery/review email design + flow rules.
- [Email single-column layout](mem://design/email-html-singlecolumn.md) — denomailer strips <style>/class; templates must use inline single-column always.
- [Review RPC params](mem://feature/review-rpc-params.md) — Param naming for review RPC calls.
