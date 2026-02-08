-- 014: Create conversations tables for AI Tutor conversation memory
-- Description: Enables context-aware AI Tutor responses by storing conversation history

-- Conversations table (conversation sessions)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),  -- Auto-generated from first message
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversation messages table (individual messages)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model_used VARCHAR(100),  -- e.g., 'mistralai/Mistral-7B-Instruct-v0.2'
    sources_used TEXT,  -- JSON string of source documents
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Comments
COMMENT ON TABLE conversations IS 'AI Tutor conversation sessions for context-aware responses';
COMMENT ON TABLE conversation_messages IS 'Individual messages in AI Tutor conversations';
COMMENT ON COLUMN conversations.title IS 'Auto-generated title from first user message';
COMMENT ON COLUMN conversation_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN conversation_messages.sources_used IS 'JSON array of RAG source documents used';
