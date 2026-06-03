-- ============================================================
-- Email Templates — Run in Supabase SQL Editor
-- ============================================================

-- 1. EMAIL TEMPLATES TABLE
create table if not exists public.email_templates (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  subject     text not null,
  body        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. AUTO-UPDATE updated_at
drop trigger if exists email_templates_updated_at on public.email_templates;
create trigger email_templates_updated_at
  before update on public.email_templates
  for each row execute procedure public.update_updated_at();

-- 3. RLS
alter table public.email_templates enable row level security;

-- All logged-in users can read templates (to use in Send Email)
drop policy if exists "authenticated_read_templates" on public.email_templates;
create policy "authenticated_read_templates" on public.email_templates
  for select using (auth.uid() is not null);

-- Only admins can create / update / delete templates
drop policy if exists "admins_manage_templates" on public.email_templates;
create policy "admins_manage_templates" on public.email_templates
  for all using (public.is_admin());
