-- Lookbook: saved/favorited rendered fits.
--
-- We reuse the existing try_on_renders table (already has user_id + prompt +
-- render_angles child with the image). Adding two columns so users can name
-- and save a rendered fit to their lookbook.

alter table public.try_on_renders
  add column if not exists name text,
  add column if not exists favorited boolean not null default false;

create index if not exists try_on_renders_user_favorited_idx
  on public.try_on_renders (user_id, favorited, created_at desc)
  where favorited = true;
