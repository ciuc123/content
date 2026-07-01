-- Add user_id column to research table for proper multi-user support
ALTER TABLE research ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create index for querying research by user
CREATE INDEX IF NOT EXISTS idx_research_user ON research(user_id);

-- Composite index for efficient queries by user and idea
CREATE INDEX IF NOT EXISTS idx_research_user_idea ON research(user_id, idea_id);

