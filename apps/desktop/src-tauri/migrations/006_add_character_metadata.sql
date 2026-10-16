-- Migration to add metadata column to characters
ALTER TABLE characters ADD COLUMN metadata TEXT DEFAULT '{}';
