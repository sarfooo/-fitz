-- FitCheck initial schema (minimal)
-- Run in Supabase SQL editor or via `supabase db push`.
-- Auth (email + password) is handled by Supabase Auth — see auth.users.

create extension if not exists "pgcrypto";

-- ---------- profiles (username) ----------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 30),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- body profile ----------

create table if not exists public.body_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  height_cm int,
  weight_kg int,
  fit_preference text check (fit_preference in ('fitted','regular','oversized','baggy')),
  photo_refs jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- base avatar (one "hero" per user, regeneratable) ----------

create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  base_image_path text not null,
  identity_description text,
  prompt text,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create index if not exists avatars_user_created_idx
  on public.avatars (user_id, created_at desc);

-- ---------- user-owned garments (uploaded or scraped later) ----------

create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('shirt','pants','shoes','outerwear','accessory')),
  bucket text not null,
  image_path text not null,
  caption text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists garments_user_category_idx
  on public.garments (user_id, category, created_at desc);

-- ---------- try-on renders (1 per session, 5 angles as children) ----------

create table if not exists public.try_on_renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  avatar_id uuid references public.avatars(id) on delete set null,
  top_garment_id uuid references public.garments(id) on delete set null,
  bottom_garment_id uuid references public.garments(id) on delete set null,
  prompt text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists try_on_renders_user_created_idx
  on public.try_on_renders (user_id, created_at desc);

create table if not exists public.render_angles (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.try_on_renders(id) on delete cascade,
  angle text not null check (angle in ('left','left_three_quarter','front','right_three_quarter','right')),
  bucket text not null,
  image_path text not null,
  raw_image_path text,
  created_at timestamptz not null default now(),
  unique (render_id, angle)
);

-- ---------- profile auto-creation on signup ----------
-- Creates an empty profiles row tied to auth.users. The client fills username
-- via a follow-up `update profiles set username = ... where user_id = auth.uid()`.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, username)
    values (new.id, 'user_' || substr(new.id::text, 1, 8))
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.profiles         enable row level security;
alter table public.body_profiles    enable row level security;
alter table public.avatars          enable row level security;
alter table public.garments         enable row level security;
alter table public.try_on_renders   enable row level security;
alter table public.render_angles    enable row level security;

-- profiles: readable by anyone authenticated (usernames are public), only owner can update
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_owner_write on public.profiles;
create policy profiles_owner_write on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

-- owner-only CRUD for the rest
do $$
declare t text;
begin
  foreach t in array array['body_profiles','avatars','garments','try_on_renders'] loop
    execute format($p$
      drop policy if exists %I_owner on public.%I;
      create policy %I_owner on public.%I
        for all to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $p$, t, t, t, t);
  end loop;
end $$;

-- render_angles: access derived from the parent render's owner
drop policy if exists render_angles_owner on public.render_angles;
create policy render_angles_owner on public.render_angles
  for all to authenticated
  using (exists (
    select 1 from public.try_on_renders r
    where r.id = render_angles.render_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.try_on_renders r
    where r.id = render_angles.render_id and r.user_id = auth.uid()
  ));
