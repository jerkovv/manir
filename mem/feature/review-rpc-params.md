---
name: submit_review_by_token RPC params
description: Exact parameter names for review submission RPC; do not rename
type: feature
---
RPC `submit_review_by_token(_token uuid, _author text, _rating integer, _comment text)`.
Edge function `review-public-api` MUST call it with keys `_token`, `_author`, `_rating`, `_comment`.
Do NOT use `_reviewer_name` or `_review_text` — those names do not exist in the RPC and will fail with "function not found in schema cache".
