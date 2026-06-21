# VAL Security Baseline

This file summarizes the backend security baseline currently implemented for VAL.

## Implemented

- Centralized server-side authorization helpers in `lib/security/permissions.ts`.
- Database-backed rate limiting in `lib/security/rate-limit.ts`.
- `AuditLog` and `RateLimitBucket` Prisma models with migration history.
- Zod validation on sensitive write routes.
- Server-side membership and role checks for group, channel, invite, message, friend, notification, and call APIs.
- CI/CD hardening with lint/build/audit, Trivy, Gitleaks, Dependabot, and protected `main`.
- Backup and recovery runbook plus daily backup workflow.

## Server-Only Environment Variables

Keep these out of browser bundles and committed files:

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`
- `AUTH_SECRET`
- `LIVEKIT_API_SECRET`
- `VAPID_PRIVATE_KEY`
- `SUPABASE_BACKUP_DATABASE_URL`
- any SMTP password, Brevo key, or Supabase service-role key

Only `NEXT_PUBLIC_*` values are intended for browser exposure.

## Permission Test Checklist

- Unauthenticated API requests return `401`.
- Non-members cannot read or mutate private group/channel resources.
- Members cannot create/delete channels or send group invites.
- Only owners can delete spaces.
- Message report review and pin moderation require owner/admin access.
- Friend calls can only be viewed, joined, ended, or declined by caller/receiver as appropriate.

## Rate Limit Test Checklist

- Login: 5 attempts per 10 minutes per IP/email.
- Signup: 3 per hour per IP.
- Password reset and verification resend: 3 per hour per IP/email.
- Friend requests: 20 per hour per user.
- Group invites: 30 per hour per group/admin.
- Messages: 60 per minute per user/channel.
- Notification/sidebar polling: 120 per minute per user/IP.

Expected response for limited JSON routes is HTTP `429` with a clean error. Form routes may need UX-specific handling if a browser form receives JSON.

## Remaining Work

- Move backup artifacts into an immutable external vault after each scheduled run.
- Enable Supabase PITR if the production RPO must be lower than one day.
- Add a monthly restore-test calendar owner and evidence location.
- Add member removal and role-management audit hooks when those APIs are introduced.
- Replace local secret-looking development credentials and rotate any value that has been shared outside a private secret manager.
