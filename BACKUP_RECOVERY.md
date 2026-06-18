# VAL Backup and Recovery Runbook

VAL stores critical state in Supabase Postgres. Backups must be restorable, isolated from the production project, and tested on a schedule.

## Current Baseline

- Supabase platform backups: keep daily backups enabled for production. If the production recovery point objective needs to be lower than one day, enable Supabase PITR on the production project.
- VAL scheduled export: `.github/workflows/database-backup.yml` runs daily at 03:17 UTC and produces:
  - `full.dump`: full custom-format Postgres dump.
  - `critical-data.dump`: data-only export for `users`, `groups`, `group_members`, `channels`, `messages`, and `group_invites`.
  - `manifest.json`: non-secret metadata and restore-test instructions.
- Manual pre-migration export: run `npm run backup:db -- --reason pre-migration` before applying Prisma or Supabase schema migrations.
- Local backup output is ignored by Git under `/backups/`.

## Required GitHub Secret

- `SUPABASE_BACKUP_DATABASE_URL`: a server-only connection string for backup jobs. Prefer Supabase session pooler for hosted backups unless the restore/export command requires direct connectivity.

Never print this value in logs. Rotate it if it appears in CI logs, screenshots, shared terminals, or chat.

## Isolated Copy Requirement

GitHub Actions artifacts are a short-retention operational copy, not the final recovery vault. After each successful daily backup, copy the artifact to an isolated storage account or backup system with:

- write-once or object-lock retention when available,
- separate credentials from the VAL production app and GitHub Actions,
- restricted restore access,
- retention that matches the business recovery policy.

## Manual Backup Before Migrations

1. Confirm no incident or active write-heavy maintenance is happening.
2. Run:
   ```bash
   BACKUP_DATABASE_URL="..." npm run backup:db -- --reason pre-migration
   ```
3. Store the backup directory in the isolated backup vault.
4. Verify `manifest.json` exists and lists the critical tables.
5. Apply the migration only after the backup copy is outside the production project.

## Monthly Restore Test

Run this monthly against a disposable database that has the current VAL schema applied. Never use production as the restore target.

1. Create or reset an isolated restore-test database.
2. Apply VAL migrations to the restore-test database.
3. Download one recent backup artifact from the isolated backup vault.
4. Run:
   ```bash
   npm run restore:smoke -- --backup-dir ./backups/<backup-id> --target-url "postgresql://..."
   ```
5. Record:
   - backup timestamp,
   - restore-test database target,
   - pass/fail,
   - table counts or verification notes,
   - any errors and fixes.

## Restore Decision Guide

- Use Supabase Dashboard restore or PITR for full production disaster recovery.
- Use `critical-data.dump` only for controlled data inspection, partial recovery, or smoke tests against an isolated database.
- Use `full.dump` for full database reconstruction testing.
- If Storage objects become critical, add a separate Storage object backup plan; database backups do not guarantee object bytes are copied.

## References

- Supabase database backups: https://supabase.com/docs/guides/platform/backups
- Supabase CLI backup and restore: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase restore to new project: https://supabase.com/docs/guides/platform/clone-project
