-- Team messages table for persistent team chat
CREATE TABLE IF NOT EXISTS team_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES team(team_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    is_edited BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages (team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender_id ON team_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sent_at ON team_messages (sent_at);

COMMENT ON COLUMN team_messages.content IS 'Content of the team message';
