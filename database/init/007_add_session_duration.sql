-- Add duration_minutes and blink_rate columns to sessions table
-- Migration: 007_add_session_duration.sql

-- Add duration_minutes column for Pomodoro timer (15, 25, 45, 60 minutes)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMENT ON COLUMN sessions.duration_minutes IS 'Planned duration in minutes (e.g., 15, 25, 45, 60 for Pomodoro)';

-- Add blink_rate column for AI analysis
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS blink_rate FLOAT;

COMMENT ON COLUMN sessions.blink_rate IS 'Blink rate from AI analysis';

-- Set default duration for existing sessions (25 minutes - classic Pomodoro)
UPDATE sessions 
SET duration_minutes = 25 
WHERE duration_minutes IS NULL;
