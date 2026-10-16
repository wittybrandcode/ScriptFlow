-- Migration to add is_deceased to characters (birth_date and death_date are already in 001)
ALTER TABLE characters ADD COLUMN is_deceased INTEGER DEFAULT 0;
