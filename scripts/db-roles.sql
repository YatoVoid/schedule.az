-- Least-privilege runtime role for Schedule.az. Run once as a superuser:
--
--   sudo -u postgres psql -d schedule -v app_password="'<random>'" -f scripts/db-roles.sql
--
-- Afterwards the app's DATABASE_URL uses schedule_app, and the deploy runs
-- migrations as the owner role through MIGRATE_DATABASE_URL (see
-- .github/workflows/deploy.yml). Safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'schedule_app') THEN
    CREATE ROLE schedule_app LOGIN;
  END IF;
END
$$;
ALTER ROLE schedule_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD :app_password;

-- Only the two Schedule.az roles may connect to this database.
REVOKE ALL ON DATABASE schedule FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE schedule TO schedule, schedule_app;

-- Nobody but the owner can create objects in the schema.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO schedule_app;

-- Rows only: no DROP, ALTER, TRUNCATE or REFERENCES for the running app.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO schedule_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO schedule_app;

-- Tables created by future migrations (run as the owner) get the same grants.
ALTER DEFAULT PRIVILEGES FOR ROLE schedule IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO schedule_app;
ALTER DEFAULT PRIVILEGES FOR ROLE schedule IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO schedule_app;

-- Prisma's migration bookkeeping stays owner-only.
REVOKE ALL ON TABLE _prisma_migrations FROM schedule_app;
