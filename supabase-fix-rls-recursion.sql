-- ============================================================
-- Fix: infinite recursion in admin RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create a security definer function that reads profiles
--    WITHOUT triggering RLS (so no recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- 2. Fix profiles admin policy
drop policy if exists "admins_all_profiles" on public.profiles;
create policy "admins_all_profiles" on public.profiles
  for all using (public.is_admin());

-- 3. Fix contacts admin policy
drop policy if exists "admins_all_contacts" on public.contacts;
create policy "admins_all_contacts" on public.contacts
  for all using (public.is_admin());

-- 4. Fix email_logs admin policy
drop policy if exists "admins_all_email_logs" on public.email_logs;
create policy "admins_all_email_logs" on public.email_logs
  for all using (public.is_admin());

-- 5. Fix follow_ups admin policy
drop policy if exists "admins_all_follow_ups" on public.follow_ups;
create policy "admins_all_follow_ups" on public.follow_ups
  for all using (public.is_admin());

-- 6. Fix smtp_settings admin policy
drop policy if exists "admins_all_smtp_settings" on public.smtp_settings;
create policy "admins_all_smtp_settings" on public.smtp_settings
  for all using (public.is_admin());
