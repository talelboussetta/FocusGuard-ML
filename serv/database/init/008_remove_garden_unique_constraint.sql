-- ============================================================================
-- File: 008_remove_garden_unique_constraint.sql
-- Purpose: Remove unique constraint on session_id to allow multiple plants per session
-- ============================================================================

-- Drop the unique constraint that enforces 1-to-1 relationship with session
ALTER TABLE garden DROP CONSTRAINT IF EXISTS garden_session_unique;

-- Add comment explaining the change
COMMENT ON TABLE garden IS 'Stores virtual garden/plant data - multiple plants can be earned per session (1 plant every 5 minutes)';
