CREATE TABLE IF NOT EXISTS scene_reminders (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_reminders_scene_id ON scene_reminders(scene_id);
