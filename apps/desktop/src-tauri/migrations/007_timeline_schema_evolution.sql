ALTER TABLE shoot_days ADD COLUMN title TEXT;
ALTER TABLE shoot_days ADD COLUMN day_type TEXT;
ALTER TABLE shoot_days ADD COLUMN primary_location_id TEXT;
ALTER TABLE shoot_days ADD COLUMN weather_forecast TEXT;
ALTER TABLE shoot_days ADD COLUMN call_time TEXT;
ALTER TABLE shoot_days ADD COLUMN wrap_time TEXT;
ALTER TABLE shoot_days ADD COLUMN estimated_cost REAL;
ALTER TABLE shoot_days ADD COLUMN production_phase TEXT;
ALTER TABLE shoot_days ADD COLUMN week_number INTEGER;

CREATE TABLE IF NOT EXISTS crew_day_assignments (
  id TEXT PRIMARY KEY,
  shoot_day_id TEXT NOT NULL,
  crew_id TEXT NOT NULL,
  role_override TEXT,
  call_time TEXT,
  notes TEXT,
  FOREIGN KEY (shoot_day_id) REFERENCES shoot_days(id) ON DELETE CASCADE,
  FOREIGN KEY (crew_id) REFERENCES crew(id) ON DELETE CASCADE
);
