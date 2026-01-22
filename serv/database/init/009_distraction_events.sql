-- Create distraction_events table
-- Tracks distraction events during focus sessions

CREATE TABLE IF NOT EXISTS distraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,  -- 'phone_usage', 'user_absent', etc.
    duration_seconds INTEGER NOT NULL DEFAULT 0,  -- How long the distraction lasted
    severity VARCHAR(20) NOT NULL DEFAULT 'low',  -- 'low', 'medium', 'high'
    
    -- Metadata
    details JSONB,  -- Additional data (phone confidence, detection metrics, etc.)
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN ('phone_usage', 'user_absent', 'multiple_persons')),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high')),
    CONSTRAINT valid_duration CHECK (duration_seconds >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_distraction_events_session ON distraction_events(session_id);
CREATE INDEX IF NOT EXISTS idx_distraction_events_user ON distraction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_distraction_events_created ON distraction_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_distraction_events_type ON distraction_events(event_type);

-- Comments
COMMENT ON TABLE distraction_events IS 'Tracks distraction events detected during focus sessions';
COMMENT ON COLUMN distraction_events.event_type IS 'Type of distraction: phone_usage, user_absent, multiple_persons';
COMMENT ON COLUMN distraction_events.duration_seconds IS 'Duration of the distraction in seconds';
COMMENT ON COLUMN distraction_events.severity IS 'Severity level: low, medium, high';
COMMENT ON COLUMN distraction_events.details IS 'Additional JSON data about the detection';
