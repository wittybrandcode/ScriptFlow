-- Migration 012: Fix scene_id in scene_snapshots to TEXT to match scenes(id)
CREATE TABLE IF NOT EXISTS scene_snapshots_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT 'auto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

INSERT INTO scene_snapshots_new (id, scene_id, snapshot_json, trigger, created_at)
SELECT id, CAST(scene_id AS TEXT), snapshot_json, trigger, created_at
FROM scene_snapshots;

DROP TABLE IF EXISTS scene_snapshots;

ALTER TABLE scene_snapshots_new RENAME TO scene_snapshots;

CREATE INDEX IF NOT EXISTS idx_scene_snapshots_scene_id ON scene_snapshots(scene_id);

