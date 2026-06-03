-- ============================================================
-- AffiliateHub — Complete Database Setup
-- Paste this entire file into Supabase SQL Editor and Run
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  email       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. CONTACTS
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  emails      text not null,        -- comma-separated list
  telegram_id text,
  notes       text,
  tags        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. EMAIL LOGS
create table if not exists public.email_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  contact_id    uuid references public.contacts(id) on delete set null,
  subject       text not null,
  body          text not null,
  recipients    text not null,      -- comma-separated emails actually sent to
  status        text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at       timestamptz default now()
);

-- 4. FOLLOW-UPS
create table if not exists public.follow_ups (
  id           uuid primary key default gen_random_uuid(),
  email_log_id uuid references public.email_logs(id) on delete cascade,
  contact_id   uuid references public.contacts(id) on delete set null,
  subject      text not null,
  body         text not null,
  scheduled_at timestamptz not null,
  sent         boolean default false,
  created_at   timestamptz default now()
);

-- 5. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. AUTO-UPDATE updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at before update on public.contacts for each row execute procedure public.update_updated_at();

-- 7. ENABLE RLS ON ALL TABLES
alter table public.profiles  enable row level security;
alter table public.contacts  enable row level security;
alter table public.email_logs enable row level security;
alter table public.follow_ups enable row level security;

-- 8. PROFILES POLICIES
drop policy if exists "users_own_profile_select" on public.profiles;
create policy "users_own_profile_select" on public.profiles for select using (auth.uid() = id);

drop policy if exists "users_own_profile_update" on public.profiles;
create policy "users_own_profile_update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "admins_all_profiles" on public.profiles;
create policy "admins_all_profiles" on public.profiles for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 9. CONTACTS POLICIES
drop policy if exists "users_own_contacts" on public.contacts;
create policy "users_own_contacts" on public.contacts for all using (auth.uid() = user_id);

drop policy if exists "admins_all_contacts" on public.contacts;
create policy "admins_all_contacts" on public.contacts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 10. EMAIL LOGS POLICIES
drop policy if exists "users_own_email_logs" on public.email_logs;
create policy "users_own_email_logs" on public.email_logs for all using (auth.uid() = user_id);

drop policy if exists "admins_all_email_logs" on public.email_logs;
create policy "admins_all_email_logs" on public.email_logs for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 11. FOLLOW-UPS POLICIES
drop policy if exists "users_own_follow_ups" on public.follow_ups;
create policy "users_own_follow_ups" on public.follow_ups for all
  using (exists (select 1 from public.email_logs where id = email_log_id and user_id = auth.uid()));

drop policy if exists "admins_all_follow_ups" on public.follow_ups;
create policy "admins_all_follow_ups" on public.follow_ups for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 12. INDEXES for performance
create index if not exists idx_contacts_user_id     on public.contacts(user_id);
create index if not exists idx_email_logs_user_id   on public.email_logs(user_id);
create index if not exists idx_email_logs_contact   on public.email_logs(contact_id);
create index if not exists idx_follow_ups_scheduled on public.follow_ups(scheduled_at) where sent = false;

-- ============================================================
-- MAKE YOURSELF ADMIN (run after signing up):
-- update public.profiles set role = 'admin' where email = 'your@email.com';
-- ============================================================
