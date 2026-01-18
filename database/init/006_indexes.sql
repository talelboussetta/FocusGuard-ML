-- ============================================================================
-- File: 006_indexes.sql
-- Purpose: Create indexes for foreign keys and performance optimization
-- ============================================================================

-- ============================================================================
-- Foreign Key Indexes
-- Purpose: Improve JOIN performance and enforce referential integrity efficiently
-- ============================================================================

-- Index on sessions.user_id for faster user-to-sessions queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Index on garden.user_id for faster user-to-garden queries
CREATE INDEX idx_garden_user_id ON garden(user_id);

-- Index on garden.session_id for faster session-to-garden queries
-- Note: session_id already has a unique constraint which creates an index,
-- but we're being explicit here for documentation purposes
CREATE INDEX IF NOT EXISTS idx_garden_session_id ON garden(session_id);

-- ============================================================================
-- Performance Indexes
-- Purpose: Optimize common queries (leaderboards, lookups, etc.)
-- ============================================================================

-- Index for leaderboard queries sorted by XP points (descending)
CREATE INDEX idx_users_xp_points_desc ON users(xp_points DESC);

-- Index for leaderboard queries sorted by total focus time (descending)
CREATE INDEX idx_user_stats_focus_min_desc ON user_stats(total_focus_min DESC);

-- Index for leaderboard queries sorted by total sessions (descending)
CREATE INDEX idx_user_stats_sessions_desc ON user_stats(total_sessions DESC);

-- Index for leaderboard queries sorted by best streak (descending)
CREATE INDEX idx_user_stats_best_streak_desc ON user_stats(best_streak DESC);

-- Index for user lookups by username
-- Note: username already has a unique constraint which creates an index,
-- but we're being explicit here for documentation purposes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for user lookups by email
-- Note: email already has a unique constraint which creates an index,
-- but we're being explicit here for documentation purposes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for session queries filtered by completion status
CREATE INDEX idx_sessions_completed ON sessions(completed);

-- Composite index for user sessions ordered by creation date
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);

-- Index for recent sessions queries
CREATE INDEX idx_sessions_created_at_desc ON sessions(created_at DESC);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON INDEX idx_sessions_user_id IS 'Speeds up queries joining sessions to users';
COMMENT ON INDEX idx_garden_user_id IS 'Speeds up queries joining garden to users';
COMMENT ON INDEX idx_garden_session_id IS 'Speeds up queries joining garden to sessions';
COMMENT ON INDEX idx_users_xp_points_desc IS 'Optimizes XP-based leaderboard queries';
COMMENT ON INDEX idx_user_stats_focus_min_desc IS 'Optimizes focus time leaderboard queries';
COMMENT ON INDEX idx_user_stats_sessions_desc IS 'Optimizes session count leaderboard queries';
COMMENT ON INDEX idx_user_stats_best_streak_desc IS 'Optimizes streak leaderboard queries';
COMMENT ON INDEX idx_sessions_completed IS 'Speeds up queries filtering by completion status';
COMMENT ON INDEX idx_sessions_user_created IS 'Optimizes user session history queries';
COMMENT ON INDEX idx_sessions_created_at_desc IS 'Speeds up recent sessions queries';
