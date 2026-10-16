-- ═══════════════════════════════════════════════
-- ScriptFlow Enterprise - Milestone 7 Optimizations
-- ═══════════════════════════════════════════════

-- 1. Additional High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_scenes_location ON scenes(location_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);

-- 2. Aggregate Views for Native Analytics
-- This view aggregates scene statistics at the database level
-- saving the UI from iterating over massive arrays in JavaScript.

CREATE VIEW IF NOT EXISTS v_scenario_stats AS
SELECT 
    s.id as scenario_id,
    s.title as scenario_title,
    (SELECT COUNT(*) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_scenes,
    (SELECT SUM(estimated_duration) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_duration,
    (SELECT COUNT(*) FROM characters c WHERE c.scenario_id = s.id AND c.deleted_at IS NULL) as total_characters,
    (SELECT COUNT(*) FROM locations l WHERE l.scenario_id = s.id AND l.deleted_at IS NULL) as total_locations
FROM scenarios s
WHERE s.deleted_at IS NULL;

-- 3. Cleanup unused orphans (Trigger Example for Referential Integrity)
-- Though we use CASCADE, this trigger ensures script_blocks without valid scenes are scrubbed immediately.
CREATE TRIGGER IF NOT EXISTS trg_cleanup_orphan_blocks
AFTER DELETE ON scenes
BEGIN
    DELETE FROM script_blocks WHERE scene_id = OLD.id;
END;
