-- 1. Scenarios (Core Project)
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'سيناريو جديد',
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  status TEXT DEFAULT 'DRAFT',
  genre TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

-- 2. Episodes (For TV Series / Episodic Content)
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'DRAFT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shoot Days (Timeline)
CREATE TABLE IF NOT EXISTS shoot_days (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  shoot_date TEXT,
  start_time TEXT,
  end_time TEXT,
  status TEXT DEFAULT 'DRAFT',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Locations
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  parent_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'INT',
  address TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  status TEXT DEFAULT 'AVAILABLE',
  map_url TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  permit_status TEXT DEFAULT 'NOT_REQUIRED',
  cost_per_day REAL DEFAULT 0.0,
  cost_currency TEXT DEFAULT 'USD',
  technical_notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS location_documents (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  document_type TEXT DEFAULT 'PERMIT',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS location_images (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 4. Crew & Cast
CREATE TABLE IF NOT EXISTS crew (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT DEFAULT 'TECHNICAL',
  image_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  contract_status TEXT DEFAULT 'PENDING',
  payment_status TEXT DEFAULT 'PENDING',
  wage REAL DEFAULT 0.0,
  currency TEXT DEFAULT 'USD',
  employment_type TEXT DEFAULT 'FREELANCE',
  job_title TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

-- 5. Characters
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES crew(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  age TEXT DEFAULT '',
  role TEXT DEFAULT '',
  gender TEXT DEFAULT 'MALE',
  status TEXT DEFAULT 'SEARCHING',
  
  -- Development & Psychology
  backstory TEXT DEFAULT '',
  psychology TEXT DEFAULT '',
  physical_traits TEXT DEFAULT '',
  arc TEXT DEFAULT '',
  relationships TEXT DEFAULT '',
  reference_images TEXT DEFAULT '[]',
  
  -- Deprecated Fields
  actor_name TEXT DEFAULT '',
  actor_photo TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  actor_bio TEXT DEFAULT '',
  
  -- Dramatic/Graph Position
  father_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
  mother_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
  dramatic_pos_x REAL DEFAULT 0,
  dramatic_pos_y REAL DEFAULT 0,
  birth_date TEXT DEFAULT NULL,
  death_date TEXT DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL
);

-- Character Relationships Graph
CREATE TABLE IF NOT EXISTS character_relationships (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'MARRIAGE',
  relationship_category TEXT DEFAULT 'BIOLOGICAL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, partner_id, relationship_type)
);

-- 6. Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  shoot_day_id TEXT REFERENCES shoot_days(id) ON DELETE SET NULL,
  
  scene_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  
  location_type TEXT DEFAULT 'INT',
  location_name TEXT DEFAULT '',
  time_of_day TEXT DEFAULT 'DAY',
  exact_time TEXT DEFAULT '',
  weather TEXT DEFAULT '',
  
  status TEXT DEFAULT 'DRAFT',
  revision_color TEXT DEFAULT 'WHITE',
  continuity TEXT DEFAULT '',
  time_shift TEXT DEFAULT '',
  
  director_notes TEXT DEFAULT '',
  extras_note TEXT DEFAULT '',
  present_characters TEXT DEFAULT '[]',
  
  planned_shoot_date TEXT DEFAULT '',
  estimated_duration REAL DEFAULT 0,
  shoot_order REAL DEFAULT 0,
  
  -- Cloning logic
  source_scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
  clone_type TEXT DEFAULT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

-- Scene Characters M2M
CREATE TABLE IF NOT EXISTS scene_characters (
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, character_id)
);

-- 7. Script Blocks
CREATE TABLE IF NOT EXISTS script_blocks (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'DIALOGUE',
  content TEXT DEFAULT '',
  metadata TEXT,
  sort_order REAL DEFAULT 0.0
);

-- 8. Production Operations
CREATE TABLE IF NOT EXISTS crew_assignments (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  crew_id TEXT NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(crew_id, episode_id, scene_id)
);

CREATE TABLE IF NOT EXISTS production_tasks (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
  crew_id TEXT REFERENCES crew(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'TODO',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tones (Global Settings)
CREATE TABLE IF NOT EXISTS tones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 10. App Settings (Auth, Config)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════
-- Performance Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_script_blocks_order ON script_blocks(scene_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scenario ON scenes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_crew_scenario ON crew(scenario_id);
CREATE INDEX IF NOT EXISTS idx_assignments_crew ON crew_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_assignments_scene ON crew_assignments(scene_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scenario ON production_tasks(scenario_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scene ON production_tasks(scene_id);
CREATE INDEX IF NOT EXISTS idx_loc_images_loc ON location_images(location_id);
CREATE INDEX IF NOT EXISTS idx_characters_scenario ON characters(scenario_id);
CREATE INDEX IF NOT EXISTS idx_locations_scenario ON locations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_script_blocks_scene_type ON script_blocks(scene_id, type);
CREATE INDEX IF NOT EXISTS idx_episodes_scenario_num ON episodes(scenario_id, episode_number);
CREATE INDEX IF NOT EXISTS idx_scene_characters_char ON scene_characters(character_id);
CREATE INDEX IF NOT EXISTS idx_scenes_shoot_day ON scenes(scenario_id, shoot_day_id);
CREATE INDEX IF NOT EXISTS idx_characters_parents ON characters(father_id, mother_id);
