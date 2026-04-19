-- Use the typed signup username when creating profiles instead of the
-- generated user_<id> fallback whenever metadata is available.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  metadata_username text;
begin
  metadata_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  insert into public.profiles (user_id, username, display_name)
    values (
      new.id,
      coalesce(metadata_username, 'user_' || substr(new.id::text, 1, 8)),
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
    )
    on conflict (user_id) do update
      set username = excluded.username,
          display_name = coalesce(excluded.display_name, public.profiles.display_name),
          updated_at = now();
  return new;
end;
$$;

update public.profiles p
set username = trimmed.new_username,
    updated_at = now()
from (
  select
    au.id as user_id,
    nullif(trim(au.raw_user_meta_data ->> 'username'), '') as new_username
  from auth.users au
) as trimmed
where p.user_id = trimmed.user_id
  and trimmed.new_username is not null
  and p.username like 'user\_%' escape '\';
