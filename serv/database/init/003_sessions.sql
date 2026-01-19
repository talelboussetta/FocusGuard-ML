-- ============================================================================
-- File: 003_sessions.sql
-- Purpose: Create sessions table for tracking user focus sessions
-- ============================================================================

CREATE TABLE sessions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to users (one user has many sessions)
    user_id UUID NOT NULL,
    
    -- Session data
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Add comment for documentation
COMMENT ON TABLE sessions IS 'Stores focus sessions created by users';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN sessions.user_id IS 'Reference to the user who created this session';
COMMENT ON COLUMN sessions.completed IS 'Whether the session was completed successfully';
COMMENT ON COLUMN sessions.created_at IS 'Timestamp when the session was created';
