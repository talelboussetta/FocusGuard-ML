-- Add edited_at column to team_messages table
ALTER TABLE team_messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

COMMENT ON COLUMN team_messages.edited_at IS 'Timestamp when the message was last edited';
