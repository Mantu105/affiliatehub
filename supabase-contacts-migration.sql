-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Adds is_partner, model, country columns to contacts
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS is_partner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model      TEXT CHECK (model IN ('Revshare', 'CPA', 'Hybrid', 'Fixed')),
  ADD COLUMN IF NOT EXISTS country    TEXT;
