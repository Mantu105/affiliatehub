-- ============================================================
-- AffiliateHub — Pre-Deploy Cleanup
-- Run once in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. DROP unused tables ───────────────────────────────────
-- email_logs and follow_ups are no longer used in the app

DROP POLICY  IF EXISTS follow_ups_all           ON follow_ups;
DROP POLICY  IF EXISTS "admins_all_follow_ups"  ON follow_ups;
DROP POLICY  IF EXISTS "users_own_follow_ups"   ON follow_ups;
DROP POLICY  IF EXISTS "admins_all_email_logs"  ON email_logs;
DROP POLICY  IF EXISTS "users_own_email_logs"   ON email_logs;

ALTER TABLE  follow_ups DROP COLUMN IF EXISTS email_log_id;
DROP TABLE   IF EXISTS public.follow_ups  CASCADE;
DROP TABLE   IF EXISTS public.email_logs  CASCADE;

-- ── 2. DROP unused columns from contacts ────────────────────
-- notes and tags were removed from the edit form UI

ALTER TABLE contacts
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS tags;

-- ── 3. DROP unused column from smtp_settings ────────────────
-- from_name field was removed from the SMTP setup form

ALTER TABLE smtp_settings
  DROP COLUMN IF EXISTS from_name;

-- ── DONE ────────────────────────────────────────────────────
-- Tables kept (all actively used):
--   profiles              — user accounts & roles
--   contacts              — core CRM data
--   smtp_settings         — email sender configuration
--   email_templates       — reusable email templates
--   user_access           — admin data access control
--   pending_password_resets — account approval flow
--
-- Columns kept in contacts:
--   id, user_id, name, emails, telegram_id,
--   is_partner, model, country, created_at, updated_at
-- ============================================================
