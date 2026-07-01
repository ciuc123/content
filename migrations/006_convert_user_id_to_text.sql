-- Convert user_id columns from uuid to text type
-- This ensures compatibility with Clerk's string user IDs
-- Clerk returns userId as a text string (e.g., "user_2N8J9J3K"), not a UUID

-- 1. Convert ideas.user_id from uuid to text
ALTER TABLE ideas ALTER COLUMN user_id TYPE text;

-- 2. Convert research.user_id from uuid to text
ALTER TABLE research ALTER COLUMN user_id TYPE text;

-- 3. Convert generated_content.user_id from uuid to text
ALTER TABLE generated_content ALTER COLUMN user_id TYPE text;

-- 4. Verify indexes are in place for performance
CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user_status ON ideas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_user ON research(user_id);
CREATE INDEX IF NOT EXISTS idx_research_user_idea ON research(user_id, idea_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user_idea ON generated_content(user_id, idea_id);

