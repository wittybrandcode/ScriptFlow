-- Migration 009: Add page_numbering table and export configuration columns to scenarios
ALTER TABLE scenarios ADD COLUMN include_master_cover INTEGER DEFAULT 1;
ALTER TABLE scenarios ADD COLUMN include_episode_covers INTEGER DEFAULT 1;
ALTER TABLE scenarios ADD COLUMN include_scene_covers INTEGER DEFAULT 0;
ALTER TABLE scenes ADD COLUMN page_count INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS page_numbering (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'MASTER_COVER', 'EPISODE_COVER', 'SCENE_COVER', 'SCENE'
  page_count INTEGER NOT NULL,
  start_page INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_page_numbering_scenario ON page_numbering(scenario_id);
CREATE INDEX IF NOT EXISTS idx_page_numbering_item ON page_numbering(item_id);
