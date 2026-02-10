-- ============================================================================
-- Quick Schema Validation - Check for Common Issues
-- ============================================================================
-- Copy-paste this into DBeaver SQL Editor and run
-- Checks only the most critical columns that cause 500 errors

\echo '============================================================'
\echo 'Quick Schema Validation'
\echo '============================================================'

-- Critical Sessions columns (these cause 500s if missing)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'duration_minutes') 
        THEN '✓ sessions.duration_minutes'
        ELSE '❌ MISSING: sessions.duration_minutes'
    END AS sessions_duration_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'blink_rate') 
        THEN '✓ sessions.blink_rate'
        ELSE '❌ MISSING: sessions.blink_rate'
    END AS sessions_blink_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'actual_duration_minutes') 
        THEN '✓ sessions.actual_duration_minutes'
        ELSE '❌ MISSING: sessions.actual_duration_minutes (CRITICAL!)'
    END AS sessions_actual_duration_check;

-- Check created_at column type (timezone issues)
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'timestamp without time zone' THEN '⚠ No timezone (may cause stats errors)'
        WHEN data_type = 'timestamp with time zone' THEN '✓ Has timezone'
        ELSE data_type
    END AS timezone_status
FROM information_schema.columns 
WHERE table_name IN ('sessions', 'users', 'user_stats')
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;

-- List all tables
SELECT 
    'Tables in database:' AS info,
    string_agg(table_name, ', ' ORDER BY table_name) AS tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

\echo ''
\echo 'If you see ❌ MISSING, run fix_schema.sql to add missing columns.'
\echo 'If timestamps show "⚠ No timezone", that is expected (code uses naive UTC).'
\echo ''
