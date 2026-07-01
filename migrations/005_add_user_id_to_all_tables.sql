-- Add user_id to existing tables (if they don't already have it)
-- This ensures backward compatibility with existing databases

-- 1. Add user_id to ideas table if not exists
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS user_id uuid;

-- If adding new column, update existing rows with a default value
-- to avoid NOT NULL constraint issues
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ideas WHERE user_id IS NULL LIMIT 1) THEN
    UPDATE ideas SET user_id = gen_random_uuid() WHERE user_id IS NULL;
  END IF;
END $$;

-- 2. Add user_id to research table if not exists
ALTER TABLE research ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM research WHERE user_id IS NULL LIMIT 1) THEN
    UPDATE research SET user_id = gen_random_uuid() WHERE user_id IS NULL;
  END IF;
END $$;

-- 3. Add user_id to generated_content table if not exists
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM generated_content WHERE user_id IS NULL LIMIT 1) THEN
    UPDATE generated_content SET user_id = gen_random_uuid() WHERE user_id IS NULL;
  END IF;
END $$;

-- 4. Make user_id NOT NULL (after filling with values)
DO $$
BEGIN
  ALTER TABLE ideas ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Column might already be NOT NULL
END $$;

DO $$
BEGIN
  ALTER TABLE research ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE generated_content ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 5. Create indexes for efficient user-scoped queries
CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user_status ON ideas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_user ON research(user_id);
CREATE INDEX IF NOT EXISTS idx_research_user_idea ON research(user_id, idea_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user_idea ON generated_content(user_id, idea_id);

