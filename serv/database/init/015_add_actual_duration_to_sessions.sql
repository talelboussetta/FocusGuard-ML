-- Migration 015: Add actual_duration_minutes to sessions table
-- Purpose: Store the actual time spent on a session (from timer state)
--          instead of only the planned duration

-- Add actual_duration_minutes column (nullable for backward compatibility)
-- This will store the actual minutes the user spent on the session
-- Defaults to NULL for existing sessions and old completed sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

COMMENT ON COLUMN sessions.actual_duration_minutes IS 
'Actual duration user spent on session in minutes (from timer state). NULL for old sessions where this was not tracked.';
