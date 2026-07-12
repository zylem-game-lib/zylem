# Asset CDN — Cloudflare R2

The arena demo (and future game packs) loads its binaries from a public R2
bucket fronted by `assets.zylem.cloud`. The bucket lives outside this repo;
the only artefacts checked in here are the **CORS rules** and the recipes
for applying / verifying them.

## Files

- [`r2-cors.json`](./r2-cors.json) — CORS rules applied to the bucket.
  - `AllowedOrigins` covers the local examples (`http://localhost:3331`) and
    shader-showcase (`http://localhost:3332`) servers, the Render staging +
    production hosts, and the apex `zylem.com` domain.
    Extend it whenever you add a new origin (e.g. a preview deploy).
  - `AllowedMethods` is `GET` + `HEAD` only — the bucket is read-only from
    the browser; uploads happen out-of-band via wrangler / API token.
  - `MaxAgeSeconds: 3600` caches the preflight for an hour, which keeps the
    request count low without tying the browser to stale rules.

## Apply (wrangler)

Requires `wrangler` 3.78+ and an account-scoped API token with
`R2 Storage:Edit` permission for the target bucket. From the repo root:

```sh
wrangler r2 bucket cors put <BUCKET_NAME> --rules-file=scripts/cdn/r2-cors.json
```

Replace `<BUCKET_NAME>` with the actual R2 bucket backing
`assets.zylem.cloud`. To inspect the currently-applied rules:

```sh
wrangler r2 bucket cors list <BUCKET_NAME>
```

## Verify

After applying (or whenever a CORS error returns), run:

```sh
# 1. Headers on a real GET (browser-equivalent)
curl -sSI 'https://assets.zylem.cloud/demos/arena/images/ground.1843023e.png' \
  -H 'origin: http://localhost:3331'

# 2. Preflight (what the browser sends before fetch / image load)
curl -sS -X OPTIONS 'https://assets.zylem.cloud/demos/arena/images/ground.1843023e.png' \
  -H 'origin: http://localhost:3331' \
  -H 'access-control-request-method: GET' \
  -i
```

A correctly-configured response includes:

```
Access-Control-Allow-Origin: http://localhost:3331
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 3600
Vary: Origin
```

If `Access-Control-Allow-Origin` is missing or echoes a different origin,
the bucket rules are out of date — rerun the `wrangler r2 bucket cors put`
command above.

## Notes

- R2 only emits CORS headers on responses **whose `Origin` header matches**
  one of the rules. A plain `curl` with no `Origin` will not show the
  headers; that's expected, not a bug.
- Preview deploys (e.g. `*.onrender.com` review apps) need their full
  origin added to `AllowedOrigins`. Wildcards on subdomains are not
  supported by R2 today; list each origin explicitly.
- This file is intentionally restrictive — do **not** set
  `AllowedOrigins: ["*"]` unless you also want to allow third-party sites
  to embed the assets without review.
