-- These tables are accessed through authorized VAL server endpoints. Browser
-- clients must not bypass that authorization through Supabase's Data API.
ALTER TABLE "music_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_voice_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "music_sessions", "user_voice_settings", "rate_limit_buckets", "audit_logs" FROM PUBLIC;

-- Keep the migration usable on ordinary Postgres, where these API roles do not
-- exist. The server's existing database role and service-role access are kept.
DO $security$
DECLARE
  api_role TEXT;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE "music_sessions", "user_voice_settings", "rate_limit_buckets", "audit_logs" FROM %I', api_role);
    END IF;
  END LOOP;
END
$security$;
