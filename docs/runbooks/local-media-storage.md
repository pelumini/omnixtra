# Local media storage

Course media uses MinIO locally and the same S3-compatible API used by Cloudflare R2 in production.
`docker compose up` creates the `omnixtra-media` bucket and applies the local browser CORS policy.

The defaults are in `.env.example`:

- `STORAGE_ENDPOINT_URL=http://minio:9000` is the API/worker container endpoint.
- `STORAGE_BROWSER_ENDPOINT_URL=http://localhost:19000` is used in browser-facing presigned URLs.
- `STORAGE_BUCKET=omnixtra-media` selects the bootstrapped bucket.

The MinIO API is available on port `19000` and its console on `19001`. Local credentials are
`minioadmin` / `minioadmin`; they are development-only defaults and must not be reused outside local
Compose. Uploads are limited to 50 MB per file and 100 MB of non-deleted media per tenant by default.
