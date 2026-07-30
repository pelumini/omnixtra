# Observability Dashboards

Sprint 5 MVP dashboards should be created in the configured Sentry and OTLP-backed metrics
workspace before a design partner launch.

## Required Panels

- API request rate, error rate, and p95 latency grouped by route family.
- Tenant-scoped error counts tagged by `tenant_id`, `request_id`, and actor where available.
- Background job throughput, failures, retries, and queue latency.
- AI tutor job latency, token usage, cache hit rate, and provider error rate.
- Billing webhook accept/failure counts and Stripe event backlog.
- Auth rate-limit rejections and refresh-token replay detections.

## Alerts

- API p95 latency above 300 ms for 10 minutes.
- Error rate above 1% for 10 minutes.
- Any P1 route family with sustained 5xx responses.
- AI provider failure rate above 5%.
- Billing webhook failures above zero for 10 minutes.
- Redis or database health check failure.

## Verification

- Confirm Sentry release/environment tags are present.
- Confirm OTel traces include `request_id` and `tenant_id`.
- Confirm dashboard links are added to the incident channel bookmark set.
