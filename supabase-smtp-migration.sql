-- ============================================================
-- SMTP Settings — Run this in Supabase SQL Editor
-- ============================================================

-- 1. SMTP SETTINGS TABLE
create table if not exists public.smtp_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null unique,
  host        text not null,
  port        integer not null default 587,
  secure      boolean not null default false,
  username    text not null,
  password    text not null,
  from_email  text not null,
  from_name   text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. AUTO-UPDATE updated_at
drop trigger if exists smtp_settings_updated_at on public.smtp_settings;
create trigger smtp_settings_updated_at
  before update on public.smtp_settings
  for each row execute procedure public.update_updated_at();

-- 3. RLS
alter table public.smtp_settings enable row level security;

drop policy if exists "users_own_smtp_settings" on public.smtp_settings;
create policy "users_own_smtp_settings" on public.smtp_settings
  for all using (auth.uid() = user_id);

drop policy if exists "admins_all_smtp_settings" on public.smtp_settings;
create policy "admins_all_smtp_settings" on public.smtp_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
