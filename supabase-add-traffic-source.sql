-- Add traffic_source column to contacts table
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS traffic_source TEXT DEFAULT NULL;
