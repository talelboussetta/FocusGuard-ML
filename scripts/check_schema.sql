-- ============================================================================
-- FocusGuard - Database Schema Checker
-- ============================================================================
-- Run this on your PRODUCTION database to check for missing columns
-- Usage: psql <your-production-db-url> -f check_schema.sql

\echo '============================================================'
\echo 'FocusGuard Database Schema Diagnostic'
\echo '============================================================'
\echo ''

\echo 'Checking sessions table...'
SELECT 'sessions table exists: ' || EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions'
)::text;

\echo ''
\echo 'Current sessions table columns:'
\echo '------------------------------------------------------------'
SELECT 
    column_name, 
    data_type, 
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking for required columns:'
\echo '------------------------------------------------------------'

-- Check duration_minutes
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' AND column_name = 'duration_minutes'
        ) 
        THEN '✓ duration_minutes exists'
        ELSE '❌ duration_minutes MISSING (from 007_add_session_duration.sql)'
    END;

-- Check blink_rate
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' AND column_name = 'blink_rate'
        ) 
        THEN '✓ blink_rate exists'
        ELSE '❌ blink_rate MISSING (from 007_add_session_duration.sql)'
    END;

-- Check actual_duration_minutes
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' AND column_name = 'actual_duration_minutes'
        ) 
        THEN '✓ actual_duration_minutes exists'
        ELSE '❌ actual_duration_minutes MISSING (from 015_add_actual_duration_to_sessions.sql)'
    END;

\echo ''
\echo '============================================================'
\echo 'Next steps:'
\echo '  - If any columns are missing, run fix_schema.sql'
\echo '  - Then restart your API server'
\echo '============================================================'
