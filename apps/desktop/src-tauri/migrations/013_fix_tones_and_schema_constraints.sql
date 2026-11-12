-- Migration 013: Fix tones schema, characters created_at, crew constraints, and views

-- 1. Upgrade tones table with scenario_id, color, created_at, deleted_at
CREATE TABLE IF NOT EXISTS tones_new (
  id TEXT PRIMARY KEY NOT NULL,
  scenario_id TEXT REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

INSERT INTO tones_new (id, name)
SELECT id, name FROM tones WHERE id IS NOT NULL;

DROP TABLE tones;
ALTER TABLE tones_new RENAME TO tones;

CREATE INDEX IF NOT EXISTS idx_tones_scenario ON tones(scenario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tones_scenario_name ON tones(scenario_id, name) WHERE scenario_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tones_global_name ON tones(name) WHERE scenario_id IS NULL;

-- 2. Add created_at to characters with constant default (compatible with SQLite ALTER TABLE)
ALTER TABLE characters ADD COLUMN created_at DATETIME DEFAULT NULL;
UPDATE characters SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- 3. Fix crew_assignments unique indexes for NULL handling
DELETE FROM crew_assignments 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM crew_assignments 
  GROUP BY crew_id, COALESCE(scene_id, ''), COALESCE(episode_id, '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_assignments_unique_scene
  ON crew_assignments(crew_id, scene_id) WHERE episode_id IS NULL AND scene_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_assignments_unique_episode
  ON crew_assignments(crew_id, episode_id) WHERE scene_id IS NULL AND episode_id IS NOT NULL;

-- 4. Add missing indexes and constraints for crew_day_assignments
DELETE FROM crew_day_assignments
WHERE id NOT IN (
  SELECT MIN(id)
  FROM crew_day_assignments
  GROUP BY shoot_day_id, crew_id
);

CREATE INDEX IF NOT EXISTS idx_crew_day_assignments_day ON crew_day_assignments(shoot_day_id);
CREATE INDEX IF NOT EXISTS idx_crew_day_assignments_crew ON crew_day_assignments(crew_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_day_assignments_unique ON crew_day_assignments(shoot_day_id, crew_id);

-- 5. Add unique index for page_numbering
DELETE FROM page_numbering
WHERE id NOT IN (
  SELECT MIN(id)
  FROM page_numbering
  GROUP BY scenario_id, item_type, item_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_numbering_unique ON page_numbering(scenario_id, item_type, item_id);

-- 6. Recreate v_scenario_stats view with COALESCE to prevent NULL sums
DROP VIEW IF EXISTS v_scenario_stats;
CREATE VIEW v_scenario_stats AS
SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    (SELECT COUNT(*) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_scenes,
    (SELECT COALESCE(SUM(estimated_duration), 0) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_duration,
    (SELECT COUNT(*) FROM characters c WHERE c.scenario_id = s.id AND c.deleted_at IS NULL) as total_characters,
    (SELECT COUNT(*) FROM locations l WHERE l.scenario_id = s.id AND l.deleted_at IS NULL) as total_locations
FROM scenarios s
WHERE s.deleted_at IS NULL;
