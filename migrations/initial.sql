-- Initial schema for Ideas Content Engine

-- ideas
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  why_it_matters text,
  virality_score integer,
  business_score integer,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- research
CREATE TABLE IF NOT EXISTS research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now()
);

-- generated_content
CREATE TABLE IF NOT EXISTS generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  linkedin_post text,
  blog_post text,
  newsletter_post text,
  seo_title text,
  seo_description text,
  slug text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user_status ON ideas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_user ON research(user_id);
CREATE INDEX IF NOT EXISTS idx_research_user_idea ON research(user_id, idea_id);
CREATE INDEX IF NOT EXISTS idx_research_idea ON research(idea_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_user_idea ON generated_content(user_id, idea_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_idea ON generated_content(idea_id);
