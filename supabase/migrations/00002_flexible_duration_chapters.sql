-- Allow target_duration to be any integer between 5 and 60 (was limited to 5, 15, 30)
ALTER TABLE projects DROP CONSTRAINT projects_target_duration_check;
ALTER TABLE projects ADD CONSTRAINT projects_target_duration_check CHECK (target_duration BETWEEN 5 AND 60);

-- Allow chapter_count up to 10 (was limited to 6)
ALTER TABLE projects DROP CONSTRAINT projects_chapter_count_check;
ALTER TABLE projects ADD CONSTRAINT projects_chapter_count_check CHECK (chapter_count BETWEEN 1 AND 10);
