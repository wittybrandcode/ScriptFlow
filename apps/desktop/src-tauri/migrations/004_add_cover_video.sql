-- Add cover_video column to store video data separately from the PNG thumbnail
ALTER TABLE scenarios ADD COLUMN cover_video TEXT DEFAULT '';
