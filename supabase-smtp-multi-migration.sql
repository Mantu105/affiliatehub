-- ============================================================
-- SMTP Multi-Account Support — Run in Supabase SQL Editor
-- ============================================================

-- 1. Remove unique constraint so each user can have multiple SMTP accounts
alter table public.smtp_settings drop constraint if exists smtp_settings_user_id_key;

-- 2. Add account name label and active flag
alter table public.smtp_settings
  add column if not exists name      text    not null default 'Default',
  add column if not exists is_active boolean not null default false;
