-- ============================================================================
-- File: 005_user_stats.sql
-- Purpose: Create user_stats table for aggregated user performance metrics
-- ============================================================================

CREATE TABLE user_stats (
    -- Primary key (also a foreign key - 1-to-1 with users)
    user_id UUID PRIMARY KEY,
    
    -- Statistics data
    total_focus_min INTEGER NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamp
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT user_stats_user_fk FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT user_stats_focus_min_positive CHECK (total_focus_min >= 0),
    CONSTRAINT user_stats_sessions_positive CHECK (total_sessions >= 0),
    CONSTRAINT user_stats_current_streak_positive CHECK (current_streak >= 0),
    CONSTRAINT user_stats_best_streak_positive CHECK (best_streak >= 0)
);

-- Add comment for documentation
COMMENT ON TABLE user_stats IS 'Stores aggregated statistics for each user (1-to-1 with users table)';
COMMENT ON COLUMN user_stats.user_id IS 'Reference to the user (also serves as primary key)';
COMMENT ON COLUMN user_stats.total_focus_min IS 'Total minutes of focus time accumulated';
COMMENT ON COLUMN user_stats.total_sessions IS 'Total number of completed sessions';
COMMENT ON COLUMN user_stats.current_streak IS 'Current consecutive days streak';
COMMENT ON COLUMN user_stats.best_streak IS 'Best consecutive days streak ever achieved';
COMMENT ON COLUMN user_stats.updated_at IS 'Last time statistics were updated';
