-- ============================================================================
-- FocusGuard - Database Schema Fix
-- ============================================================================
-- Run this on your PRODUCTION database to add missing columns
-- Usage: psql <your-production-db-url> -f fix_schema.sql
--
-- This script is IDEMPOTENT (safe to run multiple times)
-- ============================================================================

\echo '============================================================'
\echo 'Applying missing migrations to sessions table...'
\echo '============================================================'

-- Migration 007: Add duration_minutes and blink_rate
\echo ''
\echo 'Adding duration_minutes column...'
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMENT ON COLUMN sessions.duration_minutes IS 
'Planned duration in minutes (e.g., 15, 25, 45, 60 for Pomodoro)';

-- Set default for existing sessions
UPDATE sessions 
SET duration_minutes = 25 
WHERE duration_minutes IS NULL;

\echo '✓ duration_minutes added'

\echo ''
\echo 'Adding blink_rate column...'
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS blink_rate FLOAT;

COMMENT ON COLUMN sessions.blink_rate IS 'Blink rate from AI analysis';

\echo '✓ blink_rate added'

-- Migration 015: Add actual_duration_minutes
\echo ''
\echo 'Adding actual_duration_minutes column...'
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

COMMENT ON COLUMN sessions.actual_duration_minutes IS 
'Actual duration user spent on session in minutes (from timer state). NULL for old sessions where this was not tracked.';

\echo '✓ actual_duration_minutes added'

\echo ''
\echo '============================================================'
\echo 'Schema fix complete! Changes applied:'
\echo '  + sessions.duration_minutes (INTEGER, nullable)'
\echo '  + sessions.blink_rate (FLOAT, nullable)'
\echo '  + sessions.actual_duration_minutes (INTEGER, nullable)'
\echo ''
\echo 'Next step: RESTART your API server'
\echo '============================================================'
