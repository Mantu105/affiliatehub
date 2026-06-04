-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Removes email_logs table and cleans up follow_ups
-- ============================================================

-- 1. Drop the RLS policy on follow_ups that depends on email_log_id
DROP POLICY IF EXISTS follow_ups_all ON follow_ups;

-- 2. Drop the email_log_id column (FK constraint auto-drops with it)
ALTER TABLE follow_ups DROP COLUMN IF EXISTS email_log_id;

-- 3. Drop the email_logs table and all remaining references
DROP TABLE IF EXISTS public.email_logs CASCADE;

-- 4. Drop the follow_ups table
DROP TABLE IF EXISTS public.follow_ups CASCADE;
