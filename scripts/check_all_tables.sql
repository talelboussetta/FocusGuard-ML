-- ============================================================================
-- FocusGuard - Complete Database Schema Validation
-- ============================================================================
-- Run this on your PRODUCTION database to check ALL tables
-- Usage: psql $DATABASE_URL -f scripts/check_all_tables.sql

\echo '============================================================'
\echo 'FocusGuard - Complete Database Schema Validation'
\echo '============================================================'
\echo ''

-- ==========================================================================
-- 1. CHECK ALL TABLES EXIST
-- ==========================================================================
\echo '1. Checking if all required tables exist...'
\echo '------------------------------------------------------------'

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✓ users table exists'
        ELSE '❌ users table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_stats') 
        THEN '✓ user_stats table exists'
        ELSE '❌ user_stats table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') 
        THEN '✓ sessions table exists'
        ELSE '❌ sessions table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'garden') 
        THEN '✓ garden table exists'
        ELSE '❌ garden table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distraction_events') 
        THEN '✓ distraction_events table exists'
        ELSE '❌ distraction_events table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team') 
        THEN '✓ team table exists'
        ELSE '❌ team table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
        THEN '✓ team_members table exists'
        ELSE '❌ team_members table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_messages') 
        THEN '✓ team_messages table exists'
        ELSE '❌ team_messages table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') 
        THEN '✓ conversations table exists'
        ELSE '❌ conversations table MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_messages') 
        THEN '✓ conversation_messages table exists'
        ELSE '❌ conversation_messages table MISSING'
    END;

-- ==========================================================================
-- 2. CHECK SESSIONS TABLE (Critical - was causing 500s)
-- ==========================================================================
\echo ''
\echo '2. Checking sessions table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

\echo ''
\echo 'Validating critical sessions columns:'

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'duration_minutes') 
        THEN '✓ sessions.duration_minutes exists'
        ELSE '❌ sessions.duration_minutes MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'blink_rate') 
        THEN '✓ sessions.blink_rate exists'
        ELSE '❌ sessions.blink_rate MISSING'
    END;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'actual_duration_minutes') 
        THEN '✓ sessions.actual_duration_minutes exists'
        ELSE '❌ sessions.actual_duration_minutes MISSING (CRITICAL - causes 500 on /sessions, /stats/daily)'
    END;

-- ==========================================================================
-- 3. CHECK USERS TABLE
-- ==========================================================================
\echo ''
\echo '3. Checking users table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ==========================================================================
-- 4. CHECK USER_STATS TABLE
-- ==========================================================================
\echo ''
\echo '4. Checking user_stats table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_stats'
ORDER BY ordinal_position;

-- ==========================================================================
-- 5. CHECK GARDEN TABLE
-- ==========================================================================
\echo ''
\echo '5. Checking garden table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'garden'
ORDER BY ordinal_position;

-- ==========================================================================
-- 6. CHECK DISTRACTION_EVENTS TABLE
-- ==========================================================================
\echo ''
\echo '6. Checking distraction_events table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'distraction_events'
ORDER BY ordinal_position;

-- ==========================================================================
-- 7. CHECK TEAM TABLE
-- ==========================================================================
\echo ''
\echo '7. Checking team table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team'
ORDER BY ordinal_position;

-- ==========================================================================
-- 8. CHECK TEAM_MEMBERS TABLE
-- ==========================================================================
\echo ''
\echo '8. Checking team_members table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- ==========================================================================
-- 9. CHECK TEAM_MESSAGES TABLE
-- ==========================================================================
\echo ''
\echo '9. Checking team_messages table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_messages'
ORDER BY ordinal_position;

-- ==========================================================================
-- 10. CHECK CONVERSATIONS TABLE
-- ==========================================================================
\echo ''
\echo '10. Checking conversations table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- ==========================================================================
-- 11. CHECK CONVERSATION_MESSAGES TABLE
-- ==========================================================================
\echo ''
\echo '11. Checking conversation_messages table columns...'
\echo '------------------------------------------------------------'

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversation_messages'
ORDER BY ordinal_position;

-- ==========================================================================
-- 12. SUMMARY
-- ==========================================================================
\echo ''
\echo '============================================================'
\echo 'Schema Validation Complete'
\echo '============================================================'
\echo ''
\echo 'Review output above for any ❌ MISSING indicators.'
\echo 'If all show ✓, your schema is complete and matches code.'
\echo ''
