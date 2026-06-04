-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add status column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'active', 'rejected'));

-- 2. All existing users are already verified — mark them active
UPDATE profiles SET status = 'active';

-- 3. Pending password resets table
CREATE TABLE IF NOT EXISTS pending_password_resets (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  new_password  TEXT        NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE pending_password_resets ENABLE ROW LEVEL SECURITY;
-- No permissive policies = only service role (admin client) can access this table
