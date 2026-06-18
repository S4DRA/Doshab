# VAL Security Environment Checklist

Use Vercel project environment variables for production, preview, and development. Do not commit real `.env`, `.env.local`, `prisma/.env`, exported Vercel env files, database URLs, service keys, SMTP credentials, or private signing keys.

## Required Runtime Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL. This is safe for the browser.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key. This is safe for the browser, but it is not a service role key.
- `DATABASE_URL`: Server-only Postgres connection string used by Prisma. Prefer the Supabase pooler for deployed Vercel environments.
- `DIRECT_URL`: Optional server-only direct Postgres URL for local or migration workflows.
- `SESSION_SECRET`: Server-only secret for legacy VAL JWT cookies. Use at least 32 random bytes.
- `LIVEKIT_URL`: LiveKit server URL.
- `LIVEKIT_API_KEY`: Server-only LiveKit API key.
- `LIVEKIT_API_SECRET`: Server-only LiveKit API secret. Never prefix with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Web Push public key. This is safe for the browser.
- `VAPID_PUBLIC_KEY`: Optional server-side copy of the Web Push public key.
- `VAPID_PRIVATE_KEY`: Server-only Web Push private key.
- `VAPID_SUBJECT`: Web Push contact subject, such as a monitored mailto address.
- `DATABASE_CONNECTION_TIMEOUT_MS`: Optional server-only Prisma connection timeout override.

## Explicitly Forbidden In Client Bundles

- `SUPABASE_SERVICE_ROLE_KEY`
- `LIVEKIT_API_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`
- `AUTH_SECRET`
- `VAPID_PRIVATE_KEY`
- SMTP passwords, Brevo API keys, or any mail-provider secrets

Only variables prefixed with `NEXT_PUBLIC_` should be readable by browser code. Do not create `NEXT_PUBLIC_` variants for service-role keys, database URLs, LiveKit secrets, VAPID private keys, SMTP passwords, or Brevo keys.

## Rotation Checklist

- Rotate any database password, LiveKit secret, VAPID private key, SMTP password, Brevo key, or JWT/session secret that has ever appeared in a local file, shared log, screenshot, CI output, or chat transcript.
- Update Vercel environment variables after rotation for Production, Preview, and Development scopes.
- Update local developer machines through a private password manager or `vercel env pull`, not through committed files.
- Revoke old credentials in Supabase, LiveKit, and mail-provider dashboards.
- Restart Vercel deployments after replacing credentials.

## GitHub Secret Scanning

- Enable GitHub Advanced Security secret scanning if available for the repository.
- Enable push protection for secret scanning.
- Add branch protection requiring CI checks before merge.
- Treat any secret-scanning alert as a real incident: revoke the credential, replace it in Vercel, and redeploy.

## Local Development

Real local env files are intentionally ignored by `.gitignore`. Keep `.env.example` limited to placeholder names and safe comments only.
