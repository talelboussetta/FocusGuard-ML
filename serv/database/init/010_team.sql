CREATE TABLE IF NOT EXISTS team (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_members INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    total_sessions_completed INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT team_name_unique UNIQUE (team_name),
    CONSTRAINT total_members_non_negative CHECK (total_members >= 0),
    CONSTRAINT total_xp_non_negative CHECK (total_xp >= 0),
    CONSTRAINT total_sessions_completed_non_negative CHECK (total_sessions_completed >= 0)
);
