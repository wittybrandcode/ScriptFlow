-- Migration 008: Add page_eighths to scenes table
ALTER TABLE scenes ADD COLUMN page_eighths INTEGER DEFAULT 0;
