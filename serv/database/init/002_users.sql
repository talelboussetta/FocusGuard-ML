-- ============================================================================
-- File: 002_users.sql
-- Purpose: Create users table for authentication and user profile data
-- ============================================================================

CREATE TABLE users (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication & profile
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Gamification
    lvl INTEGER NOT NULL DEFAULT 1,
    xp_points INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_lvl_positive CHECK (lvl >= 1),
    CONSTRAINT users_xp_positive CHECK (xp_points >= 0)
);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Stores user authentication and profile information including gamification data';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.email IS 'Unique email address';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for authentication';
COMMENT ON COLUMN users.lvl IS 'User level for gamification (starts at 1)';
COMMENT ON COLUMN users.xp_points IS 'Experience points accumulated by user';
