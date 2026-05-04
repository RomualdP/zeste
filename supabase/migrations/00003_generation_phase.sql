-- Track unified /generate-full pipeline progress on projects
CREATE TYPE generation_phase AS ENUM ('idle', 'plan', 'scenario', 'audio', 'ready', 'error');

ALTER TABLE projects
  ADD COLUMN generation_phase generation_phase NOT NULL DEFAULT 'idle',
  ADD COLUMN generation_progress NUMERIC(3, 2) NOT NULL DEFAULT 0
    CHECK (generation_progress BETWEEN 0 AND 1),
  ADD COLUMN generation_error TEXT;
