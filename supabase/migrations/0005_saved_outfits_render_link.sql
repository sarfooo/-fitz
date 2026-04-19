-- Link saved outfits back to the try-on render that produced them, so we can
-- preload the render's angles (left / left-3/4 / front / right-3/4 / right)
-- when a user re-opens the outfit in the try-on view.

alter table public.saved_outfits
  add column if not exists render_id uuid references public.try_on_renders(id) on delete set null;

create index if not exists saved_outfits_render_id_idx
  on public.saved_outfits (render_id);
