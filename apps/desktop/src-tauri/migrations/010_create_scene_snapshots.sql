CREATE TABLE IF NOT EXISTS scene_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT 'auto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_snapshots_scene_id ON scene_snapshots(scene_id);
