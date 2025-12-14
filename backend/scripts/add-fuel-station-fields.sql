-- Migration script to add new fields to fuel_stations table
-- Run this if the table already exists

ALTER TABLE fuel_stations 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS map_link TEXT,
ADD COLUMN IF NOT EXISTS features JSONB;

