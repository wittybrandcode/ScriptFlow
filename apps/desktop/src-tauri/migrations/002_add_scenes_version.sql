-- Add version column to scenes and characters for Optimistic Locking
ALTER TABLE scenes ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE characters ADD COLUMN version INTEGER DEFAULT 1;
