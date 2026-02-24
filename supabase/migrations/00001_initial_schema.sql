-- Zeste AI Podcast Generator — Initial Schema
-- Applied via Supabase CLI: supabase db push

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_tier AS ENUM ('free', 'premium');
CREATE TYPE project_status AS ENUM ('draft', 'processing', 'ready', 'error');
CREATE TYPE source_type AS ENUM ('url', 'pdf');
CREATE TYPE source_status AS ENUM ('pending', 'ingested', 'error');
CREATE TYPE tone AS ENUM ('pedagogue', 'debate', 'vulgarization', 'interview');
CREATE TYPE chapter_status AS ENUM ('draft', 'generating', 'ready', 'error');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
  tier user_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  tone tone NOT NULL DEFAULT 'pedagogue',
  target_duration INTEGER NOT NULL DEFAULT 15 CHECK (target_duration IN (5, 15, 30)),
  chapter_count INTEGER NOT NULL DEFAULT 3 CHECK (chapter_count BETWEEN 1 AND 6),
  status project_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Sources
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type source_type NOT NULL,
  url TEXT,
  file_path TEXT,
  raw_content TEXT NOT NULL DEFAULT '',
  status source_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_project_id ON sources(project_id);

-- Chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  script JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_path TEXT,
  audio_duration INTEGER,
  status chapter_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapters_project_id ON chapters(project_id);
CREATE INDEX idx_chapters_position ON chapters(project_id, position);

-- Shared Links
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shared_links_slug ON shared_links(slug);
CREATE INDEX idx_shared_links_project_id ON shared_links(project_id);

-- Device Tokens (for push notifications)
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update own profile
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Projects: own projects only
CREATE POLICY projects_select ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY projects_update ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY projects_delete ON projects FOR DELETE USING (auth.uid() = user_id);

-- Sources: access via project ownership
CREATE POLICY sources_select ON sources FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sources.project_id AND projects.user_id = auth.uid()));
CREATE POLICY sources_insert ON sources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = sources.project_id AND projects.user_id = auth.uid()));
CREATE POLICY sources_delete ON sources FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sources.project_id AND projects.user_id = auth.uid()));

-- Chapters: access via project ownership
CREATE POLICY chapters_select ON chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY chapters_insert ON chapters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY chapters_update ON chapters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY chapters_delete ON chapters FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()));

-- Shared Links: owner can manage, public can read active links
CREATE POLICY shared_links_owner ON shared_links FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = shared_links.project_id AND projects.user_id = auth.uid()));
CREATE POLICY shared_links_public_read ON shared_links FOR SELECT
  USING (is_active = TRUE);

-- Device Tokens: own tokens only
CREATE POLICY device_tokens_select ON device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY device_tokens_insert ON device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY device_tokens_delete ON device_tokens FOR DELETE USING (auth.uid() = user_id);
